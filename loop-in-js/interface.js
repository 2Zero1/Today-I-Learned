const iter = {
  arr:[1,2,3,4],
  [Symbol.iterator](){return this;},
  next() {
    return {
      done: this.arr.length == 0,
      value: this.arr.pop()
    };
  }
};

for(const v of iter) {
  console.log(v);
}

const N2 = class {
  constructor(max) {  // 무한루프를 빠지지 않도록 항상 max를 설정해줘야한다.
    this.max = max;
  }
  [Symbol.iterator]() { // 이렇게 하면 클래스에서 인스턴스를 만드는 것처럼. 자유변수와 클로저를 이용해 인스턴스와 비슷한 함수를 만들 수 있음. 
    let cursor = 0, max = this.max; //cursor를 인스턴스 멤버 처럼 쓰게 되는것.
    return {
      done: false,
      next() {
        if(cursor > max) {
          this.done = true;
        } else {
          this.value = cursor * cursor;
          cursor ++;
        }
        return this;
      }
    }
  }
}

const a = new N2(5);

console.log([...a]);
for(const b of a) {
  
}

///////// 너무 인터페이스 지킬게 너무 많다.......

