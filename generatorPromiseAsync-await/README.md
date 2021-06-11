# Generator, promise, async/await

## sync

프로그래밍이 적재되서 순서대로 실행되는것

## async

위에서 아래로 흐르는것이 아니라 함수를 불러버림

## generator

프로그램을 중도에 멈췄다가 다시 실행할 수 있다.

```js
const infinity = (function*(){
  let i = 0;
  while(true) yield i++;
})();
console.log(infinity.next());
console.log(infinity.next());
```

yield를 이용하면 중간에 끊어준다.

```js

// 이것은 실행 로직이 넓게 분포되어 변경하기 힘들다. 
const looper = (n, f, slice = 3) => {
  let limit = 0, i = 0; //runner가 소비하는 자유변수로 (클로저를 사용함)난이도가 올라간다. 
  const runner = _=> {
    while(i < n) {
      if(limit++ < slice) f(i++);
      else {
        limit = 0;
        requestAnimationFrame(runner);
        break;
      }
    }
  };
  requestAnimationFrame(runner);
};

looper(12, console.log);

//밑의 것처럼 변경할 수 있다.
// 지역범위를 사용하는 동기로직이다.

const loop = function*(n, f, slice = 3){
  let i = 0; limit = 0;
  while(i < n) {
    if(limit++ < slice) f(i++);
    else {
      limit = 0;
      yield;
    }
  }
}

//실행기 로직이 몰려있어 동기로직으로 하고 싶다면 forof로 변경해주기만 하면된다.
const executor = iter => {
  const runner =_=>{
    const result = iter.next();
    if(result.done) return;
    requestAnimationFrame(runner);
  };
    requestAnimationFrame(runner);
};

executor(loop(10, console.log));

```

위의 두개의 핵심은 executor와 핵심로직을 나누는데 있다. 또 핵심로직을 구현할때 객체의 속성이나 자유변수를 사용하지 않고 지역변수를 사용하기 때문에 보다 쉽다.

excutor와 generator를 분리할 수 있다는 사실을 익히면 비동기 generator를 쓸 수 있다는 사실을 알게된다. 이전에는 generator에 async를 넣은게 아니라 실행기에 async를 넣었는데, 이제 generator에 async를 넣을것이다.

위의 것을 위해 제너레이터의 2번째 속성을 이해해야한다. ***yield***는 값을 받아들일 수 있다라는 사실이다
여태까지의 제너레이터는 값을 출력할때만 사용하고 있고 이를 제너레이터 이터레이팅 기법이라한다. 하지만 제너레이터가 값을 받아들이는 행위를 generator의 컨슈머패턴이라고한다. next()에 값을 인자값을 넣으면 yield가 값을 받아온다.

```js
const profile = function*(end, next, r) {
  const userid = yield $.post('member.php', {r}, next);
  let added = yield $.post('detail.php', {userid}, next);
  added = added.split(',');
  end({userid, nick:added[0], thumb:added[1]});
}

const executor = (end, gene, ...arg) => {
  const next = v => iter.next(v); //next는 iter를 인식할 수 있어야하는데, iter는 함수 안에 있기 때문에 인식을 늦게해도 된다. js는 함수가 있으면 호출 될때까지 지연실행하고 지연평가한다.(자바스크립트는 문법 에러가 없는 이상 모든 변수의 정당함을 실행 시점에 평가한다.파싱 시점에 평가 안한다.) 이 시점에 iter가 있는지는 평가를 못하지만 함수 안에 있어서 함수가 실행 되는 시점에 평가하기 때문에 실행된다.
  const iter = gene(end, next, ...arg); //next를 먼저 만들어준 이유는 iter에게 넘겨주기 위해선 next가 먼저 존재해야되기 때문이다!
  iter.next();
};

executor(console.log, profile, 123);
```

위의 코드를 보면 제너레이터는 로직과 제어구조를 분리할 수 있는 이점이 있다. yield로 끊을 수 있기 때문이다. 흐름제어는 실행기에 맡기면 된다. 동기든 비동기든 실행기에서 처리할 수 있다. iter.next()를 몇초 뒤에 실행하도록 처리할 수 있음.

## Promise

사용하는 이유는 ?

callback의 문제점은 passive async이다. 하지만 이 callback이 언제 불리는지 통제가 불가능하다.
callback이 언제 불릴지 알고 짜야될까 모르고 짜야될까 ?

모르고 짜는것(콜백에 대해 순서없는 프로그래밍을 하도록 문제없이 잘짜야함) reactive 프로그래밍임.
하지만 이건 실제로 불가능. rx가 어그리게이션 해주는 처리를 해주는게 필요하다.

순서가 제어되기 위해선 어떻게 할까? 그냥 첫번째 애가 끝나면 처리될 수 있도록 코딩한다 => 콜백지옥, 여러개가 동시에 진행될 수 있음에도 순서때문에 한개밖에 실행을 못시킨다.

왜 언제가 중요할까? 경합조건이 있기 때문이다.

```js
let result;

$.post(url1, data1, v => {
  result = v;// 1
});
$.post(url2, data2, v=> {
  result.nick = v.nick;// 2
  report(result);
})
```

### active async를 어떻게 할 수 있을까 ?

콜백의 문제는 언제 내 함수가 호출될지 모른다는 것이다.
내가 호출하고 싶을때 호출했더니 아직 로딩 안됬으면 될때까지 기다려야한다.(언제 로딩될진 모르니까 )
하지만 이것은 호출되는 시점이 2가지가 된것이다. 로딩이 됬을때와 안됬을때. 됬으면 바로 호출 아니면 기다렸다가 호출.
이것으로 인해 반쯤 액티브해 지는것이다.

```js
let result;
const promise = new Promise(r=>$.post(url1, data1, r));
promise.then(v => {
  result = v;
});

const promise1 = new Promise(r=>$.post(url1, data1, r));
const promise2 = new Promise(r=>$.post(url2, data2, r));
promise1.then(result => {
  promise2.then(v => {
    result.nick = v.nick;
    report(result);
  });
});
```

promise를 사용하면 promise를 선언해서 로딩이 될지 말지는 우리가 신경 쓰지 않는다. 이제 콜백을 실제적인 비동기 행위와 완전히 분리해서 구현할 수 있다. 그래서 제어가 우리손으로 돌아오게 되는것이다.

promise는 봉화대 전송이 아닌 경우 쓴다.

하지만 순서에 의존적이라면 promise는 쓸모가 없다. 근데 대부분이 병렬적으로 처리가 되며 설계가 어떻게 하냐에 따라 다르다. 처음에 처음부터 필요한것 다 요청하고 처리해주면된다.

비동기를 동기처럼 보이고 지역변수를 쓰기위해 generator를 사용하여 위의 코드를 쉽게 작성할 수 있다.
그것이 generator + promise이다.

```js
const profile = function*(end, r) {
  const userid = yield new Promise(res => $.post('member.php', {r}, res));
  let added = yield new Promise(res => $.post('detail.php', {userid}, res));
  added = added.split(",");
  end({userid, nick:added[0], thumb: added[1]});
};

const executor = (gene, end, ...arg) => {
  const iter = gene(end, ...arg);
  const next = ({value, done}) => {
    if(!done) value.then(v=>next(iter.next(v)));
  };
  next(iter.next());
};

executor(profile, console.log, 123);
```

promise이 callback보다 좋은점은 제어권을 갖는다는 것과 비동기 로직을 처리 하는부분을 떼어내고 그 이후에 나머지를 조립하는 콜백부분만 따로 정의할 수 있다는 점이다. 완전히 불리함으로써 executor를 만들 수 있게 되었다.

promise를 쓰는 경우는 대부분 순번이 없을 경우에 쓰는데 병렬성 가능하게 api를 설계하고 처음에 모두 요청하고 나중에 처리하는 코드로 분리하는 코드로 바꾸면 빨라진다.

## async await

결국 위의 코드는 promise를 기다리는것으로 볼 수 있다. promise를 기다리는 것을 복잡한 executor의 상호작용으로 볼 수 있다.

그리고 executor를 보면 promise가 들어온다는 가정하에 어떠한 제너레이터를 위의 실행기를 통해 처리할 수 있으며 일반화되어 있다고 볼 수 있다. 그렇다면 일반적으로 promise가 대기하는 상황을 일반화시켜서 언어에 내장할 수 있는데 이것이 async await이다.

```js
const profile = async function(end, r) {
  const userid = await new Promise(res => $.post('member.php', {r}, res));
  let added = await new Promise(res => $.post('detail.php', {userid}, res));
  added = added.split(",");
  end({userid, nick:added[0], thumb: added[1]});
};

profile(console.log, 123);
```

async 섹션은 await으로 promise를 소비한다고 볼 수 있다.
