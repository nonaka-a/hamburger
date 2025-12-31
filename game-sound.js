Object.assign(hamburgerGame, {
    loadSounds() { 
        const f = { bgm: 'bgm.mp3', select: 'select.mp3', success: 'success.mp3', order: 'order.mp3', failure: 'failure.mp3', grill: 'grill.mp3', pour: 'pour.mp3', catch: 'catch.mp3', minigameSuccess: 'minigame_success.mp3' }; 
        for (const k in f) { this.sounds[k] = new Audio(this.config.SOUND_PATH + f[k]); } 
        this.sounds.bgm.loop = true; 
        this.sounds.bgm.volume = 0.3; 
        this.sounds.grill.loop = true; 
        this.sounds.pour.loop = true; 
    },
    
    playSound(sfx, loop = false) { 
        sfx.currentTime = 0; 
        sfx.loop = loop; 
        sfx.play().catch(e => {}); 
    },

    toggleSound() { 
        const isMuted = this.sounds.bgm.muted; 
        for (const key in this.sounds) { this.sounds[key].muted = !isMuted; } 
        
        const btn = this.elements.soundToggleButton;
        if (isMuted) {
            btn.classList.remove('sound-off');
            btn.classList.add('sound-on');
            btn.textContent = "音: オン";
        } else {
            btn.classList.remove('sound-on');
            btn.classList.add('sound-off');
            btn.textContent = "音: オフ";
        }
    }
});