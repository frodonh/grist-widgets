let timeoutid;
function filter(row) {
	return true;
}

function getAttachmentUrl(field, response) {
	if (field == null) return null;
	return `${response.baseUrl}/attachments/${field[0]}/download?auth=${response.token}`;
}

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
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

	to_dom() {
		let poste = document.createElement('div');
		poste.classList.add('poste');
		if (this.director) poste.classList.add('chef');
		if (this.small_photo) {
			let photo = document.createElement('div');
			photo.classList.add('photo');
			let figure = document.createElement('figure');
			let img = document.createElement('img');
			img.setAttribute('src', this.small_photo);
			img.addEventListener("error",function() {
				let pb = this.parentNode.parentNode;
				pb.parentNode.removeChild(pb);
			});
			let bphoto = this.big_photo;
			if (bphoto) {
				img.addEventListener("mouseover",function(event) {
					if (timeoutid != 0) {
						clearTimeout(timeoutid);
						timeoutid = 0;
					}
					let tt = document.getElementById('orgtooltipid');
					let imgs = this;
					let src = bphoto;
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
			}
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

	to_dom(level=0, fold_from) {
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
		if (this.head) direction.appendChild(this.head.to_dom());
		for (let a of this.deputy) direction.appendChild(a.to_dom());
		entity.appendChild(direction);
		// Création des blocs singletons si nécessaire
		let singletons = null;
		if (this.singles.length > 0 || (this.agents.length >0 && this.children.length > 0)) {
			singletons = document.createElement('div');
			singletons.classList.add('singletons');
			let shadow = document.createElement('div');
			shadow.classList.add('shadow');
			singletons.appendChild(shadow);
		}
		// Blocs singletons
		if (this.singles.length > 0) {
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
				singleton.appendChild(this.singles[i].to_dom());
				singletonb.appendChild(singleton);
				singletons.appendChild(singletonb);
			}
			entity.appendChild(singletons);
		}
		// Bloc agents directements rattachés
		if (this.agents.length > 0 && this.children.length > 0) {
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
			let bloc = document.createElement('div');
			bloc.classList.add('bloc');
			let shadow = document.createElement('div');
			shadow.classList.add('shadow');
			bloc.appendChild(shadow);
			let cont = document.createElement('div');
			cont.classList.add('contenu');
			this.agents.sort((a,b) => {return (a.name<b.name) ? -1 : (a.name==b.name?0:1);});
			for (let a of this.agents) cont.appendChild(a.to_dom());
			bloc.appendChild(cont);
			let contenu = document.createElement('div');
			contenu.classList.add('contenu');
			contenu.appendChild(bloc);
			singleton.appendChild(contenu);
			singletonb.appendChild(singleton);
			singletons.appendChild(singletonb);
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
			//let intitule = document.createElement('div');
			//intitule.classList.add('intitule');
			//intitule.innerText = 'Chargés de mission';
			//bloc.appendChild(intitule);
			let cont = document.createElement('div');
			cont.classList.add('contenu');
			this.agents.sort((a,b) => {return (a.name<b.name) ? -1 : (a.name==b.name?0:1);});
			for (let a of this.agents) cont.appendChild(a.to_dom());
			bloc.appendChild(cont);
			contenu.appendChild(bloc);
		} else {
			for (let a of this.children) contenu.insertBefore(a.to_dom(level+1,fold_from), null);
		}
		entity.appendChild(contenu);
		return entity;
	}
}

ready(function() {
	grist.ready({requiredAccess: 'read table', columns: [
		{
			name: "nom",
			title: "Nom de l'employé",
			type: "Text",
			optional: false,
			allowMultiple: false
		},
		{
			name: "prenom",
			title: "Prénom de l'employé",
			type: "Text",
			optional: false,
			allowMultiple: false
		},
		{
			name: "email",
			title: "Email de l'employé",
			type: "Text",
			optional: true
		},
		{
			name: "poste",
			title: "Intitulé du poste",
			type: "Text",
			optional: true
		},
		{
			name: "site",
			title: "Lieu de travail",
			type: "Text",
			optional: true
		},
		{
			name: "entite",
			title: "Entité à laquelle appartient l'employé",
			type: "Ref",
			optional: false,
			allowMultiple: false
		},
		{
			name: "parent",
			title: "Entité supérieure de celle à laquelle appartient l'employé",
			type: "Ref",
			optional: false,
			allowMultiple: false
		},
		{
			name: "position",
			title: "Indique si l'employé est chef, adjoint ou singleton dans son entité",
			description: "Valeurs possibles : ['Chef', 'Adjoint', 'Singleton']",
			type: "Text",
			optional: false,
			allowMultiple: false
		},
		{
			name: "petite_photo",
			title: "URL d'une photo miniature",
			type: "Attachments",
			optional: true
		},
		{
			name: "grande_photo",
			title: "URL d'une grande photo",
			type: "Attachments",
			optional: true
		}
	]});

	grist.onRecord(function(record) {
	});

	grist.onRecords(function (records, mappings) {
		// Chargement de la structure de l'organigramme
		function populateEntity(node, parent, employees, response) {
			const subset = employees.filter((emp) => emp.parent==parent);
			for (const rec of subset) {
				let el = node.find((e) => (e.name == rec.entite));
				let current = null;
				if (el) {
					current = el;
				} else {
					current = node[node.push(new Entity(rec.entite)) - 1];
					populateEntity(current.children, rec.entite, employees, response);
				}
				let agent = new Agent(rec.nom, rec.prenom, rec.email, rec.poste, rec.site, getAttachmentUrl(rec.petite_photo, response), getAttachmentUrl(rec.grande_photo, response));
				if (rec.position == "Chef") {
					current.head = agent;
					agent.director = true;
				} else if (rec.position == "Adjoint") {
					current.deputy.push(agent);
					agent.director = true;
				} else if (rec.position == "Singleton") {
					current.singles.push(agent);
					agent.director = true;
				} else current.agents.push(agent);
			}
		}

		let main = [];
		let recs = records.map((rec) => grist.mapColumnNames(rec)).filter(filter);
		grist.docApi.getAccessToken({readOnly: true}).then(response => {
			populateEntity(main, "", recs, response);

			// Génération du DOM
			let tooltip = document.createElement('div');
			tooltip.id = 'orgtooltipid';
			let timg = document.createElement('img');
			timg.setAttribute('src','//:0');
			tooltip.appendChild(timg);
			let node = document.getElementById("organigramme");
			node.innerHTML = "";
			node.appendChild(tooltip);
			for (let entity of main) node.appendChild(entity.to_dom(0, 1));
		});
	});

	grist.onOptions((options) => {
		document.getElementById('Titre').innerHTML = options.titre || "Organigramme";
	});
});
