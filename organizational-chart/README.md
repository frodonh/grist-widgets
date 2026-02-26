# Grist organizational chart

Ce widget Grist permet de représenter des organigrammes d'entreprises.

## Fonctionnalités

Il présente les fonctionnalités suivantes :

- Il est possible d'imprimer l'organigramme au format ou de l'exporter au format PDF, en utilisant la fonction d'impression d'un iframe du navigateur
- Le rendu de l'organigramme (couleurs et taille des boîtes) est configurable dans Grist. Les options sont mémorisées d'une session à la suivante.
- L'organigramme peut être « déplié » en affichant progressivement les entités les plus basses dans la hiérarchie. Par défaut, seul l'échelon supérieur et l'échelon immédiatement inférieur sont représentés.
- Il est possible de zoomer sur une entité. Dans ce cas, seule cette entité est affichée.

L'organigramme est représenté entièrement en HTML et CSS, il ne nécessite aucune bibliothèque supplémentaire.

## Structure des données

Le widget repose sur deux structures de données :

- les entités : il s'agit des directions, départements, unités. Les entités sont organisées de façon hiérarchique. Chaque entité est sous la responsabilité d'un directeur et d'un ou plusieurs adjoints.
- les employés : les employés sont rattachés à des entités.

Il est recommandé de structurer les données selon deux tables pour refléter ces concepts.

La table "Entité" doit avoir la structure suivante :

| Champ | Description |
| ----- | ----------- |
| Entité | Nom de l'entité tel qu'il sera présenté dans l'organigramme |
| Parent | Référence vers l'entité parente dans la même table |
| Responsable | Référence vers l'employé qui assure la responsabilité de l'entité |
| Adjoints | Une ou plusieurs références vers des employés qui assure la responsabilité d'adjoints |
| Singletons | Une ou plusieurs références vers des « singletons » ; les singletons sont des employés rattachés directement au responsable d'entité sans figurer dans une sous-entité. Ils sont isolés dans l'organigramme du fait de fonctions spécifiques (directeurs de projets, chargés de mission…) |

La table "Employés" doit quant à elle avoir la structure suivante :

| Champ | Description |
| ----- | ----------- |
| Nom | Nom de l'employé |
| Prénom | Prénom de l'employé |
| Email | Adresse mail |
| Poste | Intitulé du poste occupé |
| Site | Lieu d'exercice du poste |
| Entité | Référence vers l'entité de rattachement |
| Petite photo | Photo au format vignette (quelques Ko), affichée systématiquement dans l'organigramme |
| Grande photo | Photo au format original (quelques centaines de Ko), affichée si on zoome sur la personne |

Les widgets Grist étant rattachés principalement à une unique table, il est alors recommandé de créer deux champs formule dans la table Employés :

- Entité parente : référence vers l'entité parente de l'entité d'appartenance de l'employé. La formule à utiliser est du type `=$Entite.Parent`
- Position : indique si l'employé est chef de son entité, adjoint au chef, ou singleton. Les valeurs possibles sont "Chef", "Adjoint", et "Singleton". Une formule du type suivant permet de déduire cette position depuis la table des employés : `"Chef" if $Entite.Responsable.id == $id else "Adjoint" if $id in $Entite.Adjoints else "Singleton" if $id in $Entite.Singletons else ""`
