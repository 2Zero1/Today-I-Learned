# Abstract Loop & Lazy Excution

지연실행이란 함수의 특권이다. 제어문이 즉시 실행되지 않게 하기 위해선 함수에 담아두고 함수 호출할때 까지 지연시킨다.

generator를 통해서도 지연을 시킬 수 있다.
코루틴을 지원하는 대부분의 언어에서 generator를 사용하여 지연 실행을 할 수 있음.

## Abstraction Loop

이전에도 iterator를 통해 loop를 추상화했다.
이번에는 복잡한 loop을 사용하여 abstraction의 장점을 살펴보자.

```js
{
  [Symbol.iterator]() { return this; }
  data: [{a:[1,2,3,4], b:'-'}, [5,6,7], 8, 9],
  next() {
    let v;
    while(v = this.data.shift()) {
      switch(true) {
        case Array.isArray(v):
          this.data.unshift(...v);
          break;
        case v && typeof v == 'object':
          for(var k in v) this.data.unshift(v[k]);
          break;
        default:
          return {value: v, done: false}; 
      }
    }
    return {done: true};
  }
}

// 좀 더 좋게 만들어보자

[Symbol.iterator]() { return this; }
  data: [{a:[1,2,3,4], b:'-'}, [5,6,7], 8, 9],
  next() {
    let v;
    while(v = this.data.shift()) {
      if(!(v instanceof Object)) return {value: v};
      if(!Array.isArray(v)) v = Object.values(v);
      this.data.unshift(...v);
    }
    return {done: true};
  }
}

```

함수는 값이기 때문에 변수에 할당하는게 맞다. 그래야 호이스팅에 인정하지 않고 어느시점에 함수가 만들어졌는지 정확히 인지할 수 있기 때문이다. 클래스도 동일하다.

```js
const Compx = class {
  constructor(data){ this.data = data;}
  [Symbol.iterator]() {
    const data = JSON.parse(JSON.stringify(this.data));
    return {
      next() {
        let v;
        while(v = this.data.shift()) {
          if(!(v instanceof Object)) return {value: v}; //옵셔널 옵셔널로 보이고 이 코드로는 유지보수하기가 쉽지 않다.
          if(!Array.isArray(v)) v = Object.values(v);
          this.data.unshift(...v);
        }
        return {done: true};
      }
    };
  }
  
  
}
const a = new Compx([{a:[1,2,3,4], b:'-'}, [5,6,7], 8,9]);
console.log.
```

제너레이터로 만든다면 iterator의 구조를 지켜야해서 복잡해지는 문제를 해결할 수 있다.

```js
const Compx = class {
  constructor(data){ this.data = data;}
  *gene() {
    const data = JSON.parse(JSON.stringify(this.data));
    let v;
    while(v = this.data.shift()) {        //이게 더 읽기 좋다 위의것보다.
      if(!(v instanceof Object)) yield v;
      else{
        if(!Array.isArray(v)) v = Object.values(v);
        this.data.unshift(...v);
      }
    }
  }
}
const a = new Compx([{a:[1,2,3,4], b:'-'}, [5,6,7], 8,9]);
console.log(...a.gene());
console.log(...a.gene());
```

목적이 있는 루프(위에서 만든)를 만들고 목적을 살짝 바꾸면 루프를 다시 짜야한다.

```js
//이 함수를 조금만 바꾸더라도 밑에처럼 한판을 더짜야한다.
(data, f) => {
  let v;
  while(v = data.shift()) {
    if(!(v instanceof Object)) f(v);
    else {
      if(!Array.isArray(v)) v = Object.values(v);
      data.unshift(...v);
    }
  }
}


(data, f) => {
  let v;
  while(v = data.shift()) {
    if(!(v instanceof Object)) {
      console.log(v);
      f(v);
    };
    else {
      if(!Array.isArray(v)) v = Object.values(v);
      data.unshift(...v);
    }
  }
}
```

제어문은 재활용이 안되므로 위의것처럼 중복 정의할 수 밖에 없다. 

제어문을 직접 사용하지 않고 구조객체를 이용해 루프 실행기를 별도로 구현하는 방법이 있다. 루프를 처리해주는  객체 시리즈를 만들어놓고 여기에 값을 넣거나 이 값을 이용하는 쪽으로 따로 분리해주는 작업을 해보자.

```js
(data, f) => {
  let v;
  //여기부터
  while(v = data.shift()) {
    if(!(v instanceof Object)) f(v);  
    else {
      if(!Array.isArray(v)) v = Object.values(v); //개별 구조 객체
      data.unshift(...v);
    }
  }
  //여기까진 공통 골격이며
}
```

아까 말했던 선택기는 팩토리 메서드로 보내고 각각의 선택기에 해당하는 객체들은 컴포지트 패턴을 이용해 다 분리시킨다.

```js
  const Operator = class {
    static factory(v) {
      if(v instanceof Object) {
        if(!Array.isArray(v)) v = Object.values(v);
        return new ArrayOp(v.map(v=>Operator.factory(v)));
      }else return new PrimaOp(v);
    }
    constructor(v){this.v = v;}
    operation(f){throw 'override';}
  };

  const PrimaOp = class extends Operator {
    constructor(v) { super(v);}
    operation(f){f(this.v);}
  };

  const ArrayOp = class extends Operator {
    constructor(v) { super(v);}
    operation(f){for(const v of this.v) v.operation(f);}
  };

  Operator.factory([1,2,3,{a:4, b:5}, 6, 7]).operation(console.log);
```

팩터리 + 컴포지트 + es6 iterable

```js
const Operator = class {
  static factory(v) {
    if(v instanceof Object) {
      if(!Array.isArray(v)) v = Object.values(v);
      return new ArrayOp(v.map(v=>Operator.factory(v)));
    }else return typeof v ==='string' ? new StringOp(v) : new PrimaOp(v);
  }
  constructor(v){this.v = v;}
  operation(f){throw 'override';}
};

const StringOp = class extends Operator {
  constructor(v) { super(v);}
  operation(f){for(const a of this.v) f(a);}
}

const PrimaOp = class extends Operator {
  constructor(v) { super(v);}
  operation(f){f(this.v);}
};

const ArrayOp = class extends Operator {
  constructor(v) { super(v);}
  operation(f){for(const v of this.v) v.operation(f);}
};

Operator.factory([1,2,3,{a:'123', b:5}, 6, 7]).operation(console.log);
```

팩터리 + 컴포지트 + generator

```js
const Operator = class {
  static factory(v) {
    if(v instanceof Object) {
      if(!Array.isArray(v)) v = Object.values(v);
      return new ArrayOp(v.map(v=>Operator.factory(v)));
    }else return typeof v ==='string' ? new StringOp(v) : new PrimaOp(v);
  }
  constructor(v){this.v = v;}
  *gene(f){throw 'override';}
};

const StringOp = class extends Operator {
  constructor(v) { super(v);}
  *gene(f){for(const a of this.v) yield a;}
}

const PrimaOp = class extends Operator {
  constructor(v) { super(v);}
  *gene(f){yield this.v;}
};

const ArrayOp = class extends Operator {
  constructor(v) { super(v);}
  *gene(f){for(const v of this.v) yield * v.gene();} //yield * generator는 generator의 yield 모두 처리한 이후 넘어가도록 하는것임. 위임 일드라고함.
};

for(const v of Operator.factory([1,2,3,{a:'123', b:5}, 6, 7]).gene()) console.log(v);
```

위의 코드는 루프 로직과 정책을 일반화 시켜서 계속 사용할 수 있도록 만들었다.

## lazy execution

```js
const odd = function*(data) {
  console.log("odd", odd.cnt++);
  if(v % 2) yield v;
};

odd.cnt = 0;
for(const v of odd[1,2,3,4]) console.log(v);

const take = function*(data, n) {
  for(const v of data) {
    console.log("take", take.cnt++);
    if(n--) yield v; else break;
  }
};
take.cnt = 0;
for(const v of take([1,2,3,4], 2)) console.log(v);
```

그래서 우리는 stream이란 걸로 제너레이터를 계속 연결할 수 있다. 함수형에서는 함수를 호출할때까지 지연을 하는건데, generator는 yield하면 바로 지연이 발생한다. 위의 코드가 stream이다.

```js
const Stream = class {
  static get(v){return new Stream(v);}
  constructor(v) {
    this.v = v;
    this.filters = [];
  }
  add(gene, ...arg) {
    this.filters.push(v=>gene(v, ...arg));
    return this;
  }
  *gene(){
    let v = this.v;
    for(const f of this.filters) v = f(v);
    yield* v;
  }
}
```

```js
const odd = function*(data) {
  for(const v of data) if (v%2) yield v;
};
const take = function*(data, n) {
  for(const v of data) if(n--) yield v; else break;
};
for(const v of Stream.get([1,2,3,4]).add(odd).add(take,2).gene())
console.log(v);
```

여태까지 공부한것은 다 동기 로직이다.
