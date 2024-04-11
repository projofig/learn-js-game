window.addEventListener("load", function () {
  const canvas = this.document.querySelector("#canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 600;
  canvas.height = 800;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.font = "20px Helvetica";
  ctx.fillStyle = "white";
  //行星
  class Asteroid {
    constructor(game) {
      //引入game
      this.game = game;
      this.radius = 75;

      //隨機座標
      //初始位置在外部
      this.x = -this.radius;
      this.y = Math.random() * this.game.height;
      this.image = document.querySelector("#asteroid");
      //球體大小
      this.spriteWidth = 150;
      this.spriteHeight = 155;
      //移動速度
      this.speed = Math.random() * 3 + 0.1;
      //開始條件
      this.free = true;
      this.angle = 0;
      //旋轉方向
      this.va = Math.random() * 0.02 - 0.01;
    }
    //繪製
    draw(context) {
      if (!this.free) {
        //開始新路徑
        /*
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        //描繪路徑的框
        context.stroke();
        */
        //保存狀態
        context.save();
        //指定座標
        context.translate(this.x, this.y);
        //旋轉 正>逆 負>正
        context.rotate(this.angle);
        context.drawImage(
          this.image,
          //將圖片的座標往左上角調整 與圓心重合
          -this.spriteWidth * 0.5,
          -this.spriteHeight * 0.5,
          this.spriteHeight,
          this.spriteWidth
        );
        //恢復到操作之前的狀態
        context.restore();
      }
    }
    //更新位置跟狀態
    update() {
      if (!this.free) {
        //旋轉方向
        this.angle += this.va;
        //更新Y的座標
        this.y += this.speed + 1;
        //判斷Y座標超出底邊邊界
        if (this.y > this.game.height - this.radius) {
          if (this.game.HP > 0 && this.game.score !== 3) this.game.HP--;

          this.reset();
          //爆炸未達上限 啟動爆炸
          const explosion = this.game.getExplosion();
          if (explosion) explosion.start(this.x, this.y, 0);
        }
      }
    }
    reset() {
      this.free = true;
    }
    start() {
      this.free = false;
      this.x = Math.random() * this.game.width;
      this.y = -this.radius;
    }
  }

  class Explosion {
    constructor(game) {
      this.game = game;
      this.x = 0;
      this.y = 0;
      this.speed = 0;
      this.image = document.querySelector("#explosions");
      this.spriteWidth = 300;
      this.spriteHeight = 300;
      this.free = true;
      this.frameX = 0;
      //三行 0~2隨機
      this.frameY = Math.floor(Math.random() * 3);
      //圖片長度
      this.maxFrame = 22;
      this.animationTimer = 0;
      this.animationInterval = 1000 / 30;
    }
    draw(context) {
      if (!this.free) {
        context.drawImage(
          this.image,
          //在原圖片的位置
          this.spriteWidth * this.frameX,
          this.spriteHeight * this.frameY,
          this.spriteWidth,
          this.spriteHeight,
          //在canvas的位置
          this.x - this.spriteWidth * 0.5,
          this.y - this.spriteHeight * 0.5,
          this.spriteWidth,
          this.spriteHeight
        );
      }
    }
    update(deltaTime) {
      if (!this.free) {
        this.x += this.speed;
        if (this.animationTimer > this.animationInterval) {
          //選取圖片位置
          this.frameX++;
          if (this.frameX > this.maxFrame) this.reset();
          this.animationTimer = 0;
        } else;
        this.animationTimer += deltaTime;
      }
    }
    reset() {
      this.free = true;
    }
    start(x, y, speed) {
      this.free = false;
      this.x = x;
      this.y = y;
      this.frameX = 0;
      this.speed = speed;
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.asteroidPool = [];
      this.maxAsteroids = 30;
      this.asteroidTimer = 0;
      this.asteroidInterval = 700;
      this.createAsteroidPool();

      this.score = 0;
      this.maxScore = 3;
      this.HP = 3;
      this.mouse = {
        x: 0,
        y: 0,
        //滑鼠的觸碰範圍
        radius: 2,
      };

      this.explosionPool = [];
      //同時可以出現幾個爆炸
      this.maxExplosions = 20;
      this.createExplosionPool();

      window.addEventListener("click", (e) => {
        //檢查點擊位置有沒有交集
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.asteroidPool.forEach((asteroid) => {
          if (!asteroid.free && this.checkCollision(asteroid, this.mouse)) {
            const explosion = this.getExplosion();
            if (explosion)
              //在小行星的位置爆炸 速度0
              explosion.start(asteroid.x, asteroid.y, 0);
            asteroid.reset();
            if (this.score < this.maxScore && this.HP > 0) this.score++;
          }
        });
      });
    }
    createAsteroidPool() {
      for (let i = 0; i < this.maxAsteroids; i++) {
        //創建新的Asteroid對象 加入到asteroidPool裡
        this.asteroidPool.push(new Asteroid(this));
      }
    }
    createExplosionPool() {
      for (let i = 0; i < this.maxExplosions; i++) {
        //創建新的Asteroid對象 加入到asteroidPool裡
        this.explosionPool.push(new Explosion(this));
      }
    }

    getAsteroid() {
      for (let i = 0; i < this.asteroidPool.length; i++) {
        if (this.asteroidPool[i].free) {
          return this.asteroidPool[i];
        }
      }
    }
    getExplosion() {
      for (let i = 0; i < this.explosionPool.length; i++) {
        if (this.explosionPool[i].free) {
          return this.explosionPool[i];
        }
      }
    }
    //碰撞
    checkCollision(a, b) {
      const sumOfRadii = a.radius + b.radius;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      //計算平方根
      const distance = Math.hypot(dx, dy);
      //檢查半徑和是否大於距離
      return distance < sumOfRadii;
    }
    render(context, deltaTime) {
      //定期創造 是否超過
      if (this.asteroidTimer > this.asteroidInterval) {
        const asteroid = this.getAsteroid();
        if (asteroid) asteroid.start();
        this.asteroidTimer = 0;
      } else {
        //將每次的deltatime累加
        this.asteroidTimer += deltaTime;
      }
      //對每個球
      this.asteroidPool.forEach((asteroid) => {
        asteroid.draw(context);
        asteroid.update();
      });
      this.explosionPool.forEach((explosion) => {
        explosion.draw(context);
        explosion.update(deltaTime);
      });
      //輸贏
      context.fillText("Score:" + this.score, 20, 35);
      context.fillText("HP:" + this.HP, 530, 35);
      if (this.HP <= 0) {
        context.save();
        context.textAlign = "center";
        context.fillText(
          "You lose! your score = " + this.score,
          this.width * 0.5,
          this.height * 0.25
        );
        context.restore();
      }
      if (this.score >= this.maxScore) {
        context.save();
        context.textAlign = "center";
        context.fillText("You win!", this.width * 0.5, this.height * 0.25);
        context.restore();
      }
    }
  }

  const game = new Game(canvas.width, canvas.height);
  //計時和呼叫
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    //上一次的時間保存
    lastTime = timeStamp;
    //清除畫面的內容
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);
    //在下一次重繪之前調用指定的函數 重繪時間取決於刷新率 60hz約等於16.66毫秒一次
    requestAnimationFrame(animate);
  }
  //設定初始值避免NaN
  animate(0);
});
