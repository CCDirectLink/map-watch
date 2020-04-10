const fs = require('fs');

export default class MapWatcher extends Plugin {
	constructor() {
		super();
		this.watchloads = 0;
		this.lastPos = {x: 0, y: 0, z: 0};
	}

	prestart() {
		if (window.isBrowser) {
			throw new Error('MapWatcher does not work in the browser.');
		}

		fs.watch('./assets/', {
			recursive: true
		}, (event, filename) => this._fileChanged(event, filename));
        
		const self = this;
		sc.CrossCode.inject({
			init(...args) {
				this.parent(...args);
				this.addons.levelLoaded.push(self);
			}
		});
	}

	/**
     * 
     * @param {string} event 
     * @param {string} filename 
     */
	_fileChanged(event, filename) {
		if (this._isMap(filename)) {
			this._loadMap(filename);
		}
	}

	/**
     * 
     * @param {string} filename 
     */
	_isMap(filename) {
		return !!filename
        && filename.endsWith('.json')
        && /^(mods\/[^/]+\/assets\/)?data\/maps\//.test(filename.replace(/\\/g, '/'));
	}

	/**
     * 
     * @param {string} filename 
     */
	_getMapName(filename) {
		return filename
			.replace(/\\/g, '/')
			.replace(/^mods\/[^/]+\/assets\//, '')
			.replace(/^data\/maps\//, '')
			.replace(/\.json$/, '')
			.replace(/\//g, '.');
	}

	/**
     * 
     * @param {string} filename 
     */
	_loadMap(filename) {
		const name = this._getMapName(filename);
		if (ig.game.playerEntity && name === ig.game.mapName) {
			this.watchloads++;
			this.lastPos = ig.game.playerEntity.coll.pos;
			ig.game.setTeleportTime(0, 0);
			ig.game.teleport(name);
			ig.overlay.setAlpha(0);
		} else {
			ig.game.teleport(name);
		}
	}
    
	onLevelLoaded() {
		if (this.watchloads) {
			this.watchloads--;
			ig.game.playerEntity.setPos(this.lastPos.x, this.lastPos.y, this.lastPos.z);
		}
	}
}