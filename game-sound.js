Object.assign(hamburgerGame, {
    loadSounds() { 
        const f = { 
            bgm: 'bgm.mp3', 
            bgmJazz: 'bgm-jazz.mp3',
            bgmPop: 'bgm-pop.mp3',
            bgmPoop: 'bgm-poop.mp3',
            bgmMagic: 'bgm-magic.mp3',
            contest: 'contest.mp3', // 追加: コンテスト用BGM
            select: 'select.mp3', success: 'success.mp3', order: 'order.mp3', failure: 'failure.mp3', grill: 'grill.mp3', pour: 'pour.mp3', catch: 'catch.mp3', minigameSuccess: 'minigame_success.mp3',
            rankUp: 'rank-up.mp3'
        }; 
        for (const k in f) { this.sounds[k] = new Audio(this.config.SOUND_PATH + f[k]); } 
        
        // ループ再生設定
        ['bgm', 'bgmJazz', 'bgmPop', 'bgmPoop', 'bgmMagic', 'contest'].forEach(k => {
            this.sounds[k].loop = true;
            this.sounds[k].volume = 0.3;
        });
        
        this.sounds.grill.loop = true; 
        this.sounds.pour.loop = true; 
    },
    
    // ... (以下のメソッドは変更なし) ...
    
    playSound(sfx, loop = false) { 
        sfx.currentTime = 0; 
        sfx.loop = loop; 
        sfx.play().catch(e => {}); 
    },

    cycleBgm() {
        const bgmList = ['bgm', 'bgmJazz', 'bgmPop', 'bgmPoop', 'bgmMagic'];
        const currentKey = bgmList[this.state.bgmIndex];
        this.sounds[currentKey].pause();
        this.sounds[currentKey].currentTime = 0;

        this.state.bgmIndex = (this.state.bgmIndex + 1) % bgmList.length;
        const nextKey = bgmList[this.state.bgmIndex];

        if (!this.sounds[currentKey].muted) {
            this.sounds[nextKey].muted = false;
            this.sounds[nextKey].play().catch(e => {});
        } else {
            this.sounds[nextKey].muted = true;
        }
    },

    selectBgm(index) {
        const bgmList = ['bgm', 'bgmJazz', 'bgmPop', 'bgmPoop', 'bgmMagic'];
        if (index === this.state.bgmIndex) return;

        const currentKey = bgmList[this.state.bgmIndex];
        this.sounds[currentKey].pause();
        this.sounds[currentKey].currentTime = 0;

        this.state.bgmIndex = index;
        const nextKey = bgmList[this.state.bgmIndex];

        if (!this.sounds[currentKey].muted) {
            this.sounds[nextKey].muted = false;
            this.sounds[nextKey].play().catch(e => {});
        } else {
            this.sounds[nextKey].muted = true;
        }
    },

    toggleSound() { 
        // contestも対象に含めるため、全Audioオブジェクトを操作する既存ロジックでOK
        const bgmList = ['bgm', 'bgmJazz', 'bgmPop', 'bgmPoop', 'bgmMagic'];
        const currentBgm = this.sounds[bgmList[this.state.bgmIndex]];
        const isMuted = currentBgm.muted; 
        
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
    },

    // 追加: 現在のBGMを一時停止・再開するヘルパー
    pauseCurrentBgm() {
        const bgmList = ['bgm', 'bgmJazz', 'bgmPop', 'bgmPoop', 'bgmMagic'];
        const currentKey = bgmList[this.state.bgmIndex];
        this.sounds[currentKey].pause();
    },

    resumeCurrentBgm() {
        const bgmList = ['bgm', 'bgmJazz', 'bgmPop', 'bgmPoop', 'bgmMagic'];
        const currentKey = bgmList[this.state.bgmIndex];
        // ミュート状態でなければ再生
        if (!this.sounds[currentKey].muted) {
            this.sounds[currentKey].play().catch(e => {});
        }
    },
    
    playContestBgm() {
        this.pauseCurrentBgm();
        this.playSound(this.sounds.contest, true);
    },
    
    stopContestBgm() {
        this.sounds.contest.pause();
        this.sounds.contest.currentTime = 0;
        this.resumeCurrentBgm();
    }
});