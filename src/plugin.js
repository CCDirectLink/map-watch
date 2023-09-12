const fs = require('fs');
const chokidar = require("chokidar");

export default class MapWatcher {
	constructor() {
		this.watchloads = 0;
		this.lastPos = {x: 0, y: 0, z: 0};
	}

	prestart() {
		if (window.isBrowser) {
			throw new Error('MapWatcher does not work in the browser.');
		}

		chokidar.watch('./assets/').on('all', (event, filename) => this._fileChanged(event, filename));
		// fs.watch('./assets/', {
		// 	recursive: true
		// }, (event, filename) => this._fileChanged(event, filename));
        
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
	async _fileChanged(event, filename) {
		if (this._isMap(filename) && await this._exists(filename)) {
			this._addToAssets(filename);
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
        && /^assets\/(mods\/[^/]+\/assets\/)?data\/maps\//.test(filename.replace(/\\/g, '/'));
	}

	/**
	 * 
	 * @param {string} filename 
	 * @returns {Promise<boolean>}
	 */
	_exists(filename) {
		return new Promise((resolve) => {
			fs.stat('./' + filename, (err, stat) => {
				if (err) {
					return resolve(false);
				}
				resolve(stat.isFile());
			});
		});
	}

	/**
     * 
     * @param {string} filename 
     */
	_getMapName(filename) {
		return filename
			.replace(/\\/g, '/')
			.replace(/^assets\/mods\/[^/]+\/assets\//, '')
			.replace(/^data\/maps\//, '')
			.replace(/\.json$/, '')
			.replace(/\//g, '.');
	}

	/**
	 * 
	 * @param {string} filename 
	 */
	_getDirName(filename) {
		filename = filename.replace(/\\/g, '/');
		return 'assets/' + filename.substr(0, filename.indexOf('/', 5)) + '/';
	}

	/**
	 * 
	 * @param {string} filename 
	 */
	_getMod(filename) {
		const baseDir = this._getDirName(filename);
		if ("activeMods" in window)
			return window.activeMods.find(mod => mod.baseDirectory === baseDir);
		else
			return Array.from(modloader.loadedMods.values()).find(mod => mod.baseDirectory === baseDir);
	}

	/**
	 * 
	 * @param {string} filename 
	 */
	_addToAssets(filename) {
		const mod = this._getMod(filename);
		if (mod) {
			mod.assets.push(filename.replace(/\\/g, '/'));
		}
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