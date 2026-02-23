let timeoutid;
function filter(row) {
	return true;
}

function offsetRelative(element,ancestor) {
	let offsets=[0,0];
	let cur=element;
	while (cur!==ancestor) {
		offsets[0]+=cur.offsetLeft;
		offsets[1]+=cur.offsetTop;
		cur=cur.offsetParent;
	}
	return offsets;
}

class Agent {
	constructor(name, fname, email, position, site, small_photo=null, big_photo=null, state=null, director=false) {
		this.name = name;
		this.fname = fname;
		this.email = email;
		this.position = position;
		this.site = site;
		this.small_photo = small_photo;
		this.big_photo = big_photo;
		this.state = state;
		this.director = director;
	}

	to_dom(with_photo) {
		let poste = document.createElement('div');
		poste.classList.add('poste');
		if (this.director) poste.classList.add('chef');
		if (with_photo) {
			let photo = document.createElement('div');
			photo.classList.add('photo');
			let figure = document.createElement('figure');
			let img = document.createElement('img');
			img.addEventListener("error",function() {
				let pb = this.parentNode.parentNode;
				pb.parentNode.removeChild(pb);
			});
			img.addEventListener("mouseover",function(event) {
				if (timeoutid != 0) {
					clearTimeout(timeoutid);
					timeoutid = 0;
				}
				let tt = document.getElementById('orgtooltipid');
				let imgs = this;
				let src = this.big_photo;
				let img = tt.getElementsByTagName('img')[0];
				img.setAttribute('src',src);
				timeoutid=setTimeout(function() {
					let parentorg = document.getElementById('organigramme');
					tt.style.display = 'block';
					let offsets = offsetRelative(imgs, parentorg);
					let offsetX = event.offsetX;
					let offsetY = event.offsetY;
					if (offsetX === undefined || (offsetX == 0 && offsetY == 0)) {
						let rec = event.target.getBoundingClientRect();
						offsetX = event.clientX - rec.left;
						offsetY = event.clientY - rec.top;
					}
					let ol = offsets[0] + offsetX + 5;
					let ot = offsets[1] + offsetY + 5;
					if (ol+tt.offsetWidth > parentorg.offsetWidth+parentorg.scrollLeft) {
						ol -= tt.offsetWidth + 10;
						if (ol < 0) ol = 0;
					}
					if (ot+tt.offsetHeight > parentorg.offsetHeight+parentorg.scrollTop) {
						ot -= tt.offsetHeight + 10;
						if (ot<0) ot = 0;
					}
					tt.style.left = ol.toString()+"px";
					tt.style.top = ot.toString()+"px";
				},100);
			});
			img.addEventListener("mouseout",function() {
				if (timeoutid != 0) {
					clearTimeout(timeoutid);
					timeoutid = 0;
				}
				timeoutid=setTimeout(function() {
					let tt = document.getElementById('orgtooltipid');
					tt.style.display = 'none';
					let img = tt.getElementsByTagName('img')[0];
					img.setAttribute('src','//:0');
				},1000);
			});
			img.setAttribute('src', this.small_photo);
			figure.appendChild(img);
			photo.appendChild(figure);
			poste.appendChild(photo);
		}
		let bloc = document.createElement('div');
		bloc.classList.add('bloc');
		let intitule = document.createElement('div');
		intitule.classList.add('intitule');
		intitule.innerHTML = this.position;
		bloc.appendChild(intitule);
		let agent = document.createElement('div');
		agent.classList.add('agent');
		if (this.state !== null) agent.dataset['status'] = this.state;
		if (this.email !== null) agent.innerHTML = `<a href="mailto:${this.email}">${this.fname} ${this.name}</a>`;
		else agent.innerHTML = this.fname + ' ' + this.name;
		bloc.appendChild(agent);
		poste.appendChild(bloc);
		return poste;
	}
}

class Entity {
	constructor(name) {
		this.name = name;
		this.head = null;
		this.deputy = [];
		this.singles = [];
		this.children = [];
		this.agents = [];
	}

	to_dom(level=0, fold_from, with_photo) {
		// Bloc nom de l'entité
		let entity = document.createElement('div');
		entity.classList.add('entite');
		if (level >= fold_from) entity.classList.add('folded');
		if (level == 0) entity.classList.add('direction');
		else for (let direct of ['right','left']) {
			let shadow = document.createElement('div');
			shadow.classList.add('shbottom',direct);
			entity.appendChild(shadow);
		}
		let nom = document.createElement('div');
		nom.classList.add('nom');
		nom.innerHTML = this.name;
		// Bouton de pliage
		let buttonfold = document.createElement('div');
		buttonfold.classList.add('button','fold');
		let afold = document.createElement('a');
		afold.setAttribute('href','#');
		afold.onclick = function() {
			this.closest('.entite').classList.toggle('folded');
			return false;
		}
		buttonfold.appendChild(afold);
		nom.appendChild(buttonfold);
		// Bouton de zoom
		let buttonzoom = document.createElement('div');
		buttonzoom.classList.add('button','zoom');
		let azoom = document.createElement('a');
		azoom.setAttribute('href','#');
		azoom.onclick = function() {
			let thisent = this.closest('.entite');
			thisent.classList.toggle('zoomed');
			let zoomed = thisent.classList.contains('zoomed');
			thisent = thisent.parentElement.closest('.entite');
			while (thisent !== null) {
				if (zoomed) {
					thisent.classList.add('hidden'); 
					thisent.classList.remove('zoomed');
				} else thisent.classList.remove('hidden');
				thisent = thisent.parentElement.closest('.entite');
			} 
			return false;
		}
		buttonzoom.appendChild(azoom);
		nom.appendChild(buttonzoom);
		// Bloc direction
		entity.appendChild(nom);
		let direction = document.createElement('div');
		direction.classList.add('direction');
		if (this.children.length>0 || this.agents.length>0) {
			let shadow = document.createElement('div');
			shadow.classList.add('shtop');
			direction.appendChild(shadow);
		}
		direction.appendChild(this.head.to_dom(with_photo));
		for (let a of this.deputy) direction.appendChild(a.to_dom(with_photo));
		entity.appendChild(direction);
		// Bloc singleton
		if (this.singles.length > 0) {
			let singletons = document.createElement('div');
			singletons.classList.add('singletons');
			let shadow = document.createElement('div');
			shadow.classList.add('shadow');
			singletons.appendChild(shadow);
			for (let i=0; i<this.singles.length; ++i) {
				let singletonb = document.createElement('div');
				singletonb.classList.add('singletonb');
				let shadd = document.createElement('div');
				shadd.classList.add('shadow');
				singletonb.appendChild(shadd);
				let singleton = document.createElement('div');
				singleton.classList.add('singleton');
				let shad = document.createElement('div');
				shad.classList.add('shadow');
				singleton.appendChild(shad);
				singleton.appendChild(this.singles[i].to_dom(with_photo));
				singletonb.appendChild(singleton);
				singletons.appendChild(singletonb);
			}
			entity.appendChild(singletons);
		}
		// Bloc contenu
		let contenu = document.createElement('div');
		contenu.classList.add('contenu');
		if (this.children.length == 0) {
			let bloc = document.createElement('div');
			bloc.classList.add('bloc');
			let shadow = document.createElement('div');
			shadow.classList.add('shadow');
			bloc.appendChild(shadow);
			let intitule = document.createElement('div');
			intitule.classList.add('intitule');
			intitule.innerText = 'Chargés de mission';
			bloc.appendChild(intitule);
			let cont = document.createElement('div');
			cont.classList.add('contenu');
			this.agents.sort((a,b) => {return (a.name<b.name) ? -1 : (a.name==b.name?0:1);});
			for (let a of this.agents) cont.appendChild(a.to_dom(with_photo));
			bloc.appendChild(cont);
			contenu.appendChild(bloc);
		} else {
			for (let a of this.children) contenu.insertBefore(a.to_dom(level+1,fold_from,with_photo), null);
		}
		entity.appendChild(contenu);
		return entity;
	}
}

function populate_chart(xhttp, node) {
	// Chargement de la structure de l'organigramme
	if (xhttp.status!=200) return;
	let main=[];
	let data=xhttp.responseText.split('\n');
	for (let i=1;i<data.length;++i) {
		if (data[i].length==0) continue;
		let row=data[i].split('\t');
		if (!filter(row)) continue;
		let agent=new Agent(row[1],row[2],row[6],row[7],row[0],null);
		let current=null;
		for (let j=3;j<6;++j) {
			let ch=(current==null)?main:current.children;
			if (row.length>j && row[j]!='') {
				let el=ch.find((e) => {return e.name==row[j]});
				if (!el) {
					current=ch[ch.push(new Entity(row[j]))-1];
				} else {
					current=el;
				}
			} else break;
		}
		if (row.length>8 && row[8]=='C') {
			current.head=agent;
			agent.director=true;
		} else if (row.length>8 && row[8]=='CA') {
			current.deputy.push(agent);
			agent.director=true;
		} else if (row.length>8 && row[8]=='S') {
			current.singles.push(agent);
			agent.director=true;
		} else current.agents.push(agent);
	}
	// Génération du DOM
	let tooltip=document.createElement('div');
	tooltip.id='orgtooltipid';
	let timg=document.createElement('img');
	timg.setAttribute('src','//:0');
	tooltip.appendChild(timg);
	node.appendChild(tooltip);
	for (let entity of main) node.appendChild(entity.to_dom(0,1,true));
}

grist.ready({columns: [
	{
		name: "Nom",
		description: "Nom de l'employé",
		type: "Text"
	},
	{
		name: "Prénom",
		description: "Prénom de l'employé",
		type: "Text"
	},
	{
		name: "Email",
		description: "Email de l'employé",
		type: "Text",
		optional: true
	},
	{
		name: "Site",
		description: "Lieu de travail de l'employé",
		type: "Text",
		optional: true
	},
	{
		name: "Poste",
		description: "Intitulé du poste",
		type: "Text",
		optional: true
	},
	{
		name: "Entité",
		description: "Entité à laquelle appartient l'employé",
		type: "Text"
	},
	{
		name: "Entité parente",
		description: "Entité supérieure de celle à laquelle appartient l'employé",
		type: "Text"
	},
	{
		name: "Chef",
		description: "Indique si l'employé est responsable de son entité",
		type: "Bool"
	},
	{
		name: "Adjoint",
		description: "Indique si l'employé est responsable adjoint de son entité",
		type: "Bool"
	},
	{
		name: "Singleton",
		description: "Indique si l'employé est rattaché au chef d'entité sans être rattaché à une sous-entité",
		type: "Bool"
	},
	{
		name: "Petite photo",
		description: "URL d'une photo miniature",
		type: "Text",
		optional: true
	},
	{
		name: "Grande photo",
		description: "URL d'une grande photo",
		type: "Text",
		optional: true
	}
]});

grist.onRecords(function (records) {
	// Chargement de la structure de l'organigramme
	function populateEntity(node, parent, employees) {
		for (const rec of employees.filter((emp) => emp["Entité parente"]==parent)) {
			let el = node.find((e) => (e.name == rec["Entité"]));
			let current = (el) ? el : node[node.push(new Entity(rec["Entité"])) - 1];
			let agent = new Agent(mapped["Nom"], mapped["Prénom"], mapped["Email"], mapped["Poste"], mapped["Site"], mapped["Petite photo"], mapped["Grande photo"]);
			if (rec["Chef"]) {
				current.head = agent;
				agent.director = true;
			} else if (rec["Adjoint"]) {
				current.deputy.push(agent);
				agent.director = true;
			} else if (rec["Singleton"]) {
				current.singles.push(agent);
				agent.director = true;
			} else current.agents.push(agent);
			populateEntity(current.children, rec["Entité"], employees);
		}
	}

	let main = [];
	let recs = records.map((rec) => grist.mapColumnNames(rec)).filter(filter);
	populateEntity(main, "", recs);

	// Génération du DOM
	let tooltip = document.createElement('div');
	tooltip.id = 'orgtooltipid';
	let timg = document.createElement('img');
	timg.setAttribute('src','//:0');
	tooltip.appendChild(timg);
	node.appendChild(tooltip);
	let node = document.getElementById("organigramme");
	for (let entity of main) node.appendChild(entity.to_dom(0, 1, true));
});
