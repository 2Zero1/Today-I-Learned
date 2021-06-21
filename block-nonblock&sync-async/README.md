# block-nonblock&sync-async

## blocking function

점유하는 시간 만큼 블록(cpu가 해당 명령을 처리하는 것.)을 일으키는 함수

```js
const f = v -> {
  let i = 0;
  while(i++ < v);
  return i;
}

f(10);
f(1000000000);
```

배열 순회, 정렬 - 배열 크기에 따라
DOM순회 - DOM의 하위 구조에 따라
이미지프로세싱 - 이미지크기에 따라
***시간이 달라지며 블록함수이다.***

블록함수는 안죽을때 까지만 허용이 된다.

### blocking evasion

1. 독점적인 cpu점유로 인해 모든 동작이 정지된다.
2. 타임아웃체크에 의해 프로그래밍 강제 중단됨.
3. ***블로킹의 조합을 예측할 수 없다.*** 밑의 코드를 보면 어떤 함수에서 죽을지 알수가 없다.

```js
const f = v -> other(some(v), v * 2);
f(10);
```

그래서 함수가 최대한 블록이지 않도록 해야한다.

우리는 기본을 블로킹방식으로 사용한다. 그렇기 때문에 피할 순 없고 그냥 관리해야할 존재이다.

### time slicing

블로킹을 피하는 한가지 방법이다.

동기코드

```js
const looper = (n,f) => {
  for(let i = 0; i < n; i ++) f(i);
};

looper(10, console.log);
looper(10000, console.log);
```

타임 슬라이싱한 코드

```js
const looper = (n, f, slice = 3) => {
  let limit = 0, i = 0;
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
```

위의 코드는 n이 뭐든 바로 반환한다. 루프로 looper를 10000번 돌려도 블로킹 당하지 않는다.
하지만 위의 코드는 f가 한번 호출시 5초 걸리면 또 강제 종료당할것이다.

```js
const looper = (n, f, ms = 3000, i = 0) => {
  let old = performance.now(), curr;
  const runner = _=> {
    while(i < n) {
      curr = performance.now();   // 시간은 컴퓨터의 칩에 있어 io에 접근하면 느리다. date는 io에 접근해서 가져와서 굉장히 느리지만, performance.now는 브라우저가 시작되면 메모리에 넣어놓기 때문에 보다 낫다. 노드엔 이게 없다.
      if(curr - old < ms) f(i++);
      else {
        old = curr;
        requestAnimationFrame(runner);
        break;
      }
    }
  };
  requestAnimationFrame(runner);
};

looper(12, console.log);
```

nonblock은 리턴 바로 되냐 안되냐의 문제지, 타임슬라이싱이랑은 관련이 없다. timeslicing을 해준 이유는 다음 frame으로 함수를 넘겼는데 거기서 블록되서 죽는것을 방지하기 위해서이다.

큰 json도 timeslicing 안하면 블로킹되서 죽을 수 있다.

### web worker

이전 크롬에선 웹 워커를 띄워도 멀티스레드로 안하고 싱클스레드로만 했다. 하지만 지금은 된다.

```js
const backRun = (f, end, ...arg) => {
  const blob = new Blob([`
    onmessage =>e=> postMessage((${f})(e.data));
  `], {type: 'text/javascript'});
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  worker.onmessage = e=>end(e.data);
  worker.onerror = e=>end(null);
  worker.postMessage(arg);
}

backRun(v=>v[0] + v[1], console.log, 3, 5);
```

mainUI는 원스레드에서 처리하고 있는데 근데 js를 실행할 수 있는 또다른 스레드를 만들 수 있다. 그것이 webworker이다.
웹 워커의 장점은 백그라운드에서 실행할때 백그라운드 로직이 블로킹 되지 않는단 장점이 있다. 이미지를 1m짜릴 올리든 2m짜릴 올리든 상관없다. 브라우저에 있는 webworker는 background에 canvas와 ajax도 있다. 백그라운드 스레드를 사용하면 좋은점은 타임아웃 제한이 없다.

webworker를 실행하기 위한 제약조건은 반드시 독립되어 있는 js파일을 따로 로딩해야 한다는 것이다.

background 스레드로 보내버렸기 때문에 오래걸리더라도 문제가 되지 않고 noneblocking으로 바로 반환된다.

결국 blocking evasion은 nonblocking이라는 것이다.
서브루틴이 즉시 플로우 제어권을 내놓는다.

```js
const a = 123;
looper(12, console.log);
backRun(v => v[0]+ v[1], console.log, 3, 5);
console.log(a);
```

requestAnimationFrame이나 웹 워커나 다음 프레임에서 반환한다.

## sync, async

sync : 서브 루틴이 즉시 값을 반환한다.

```js
const double = v => v*2;
console.log(double(2));
```

async 서브 루틴이 콜백을 통해 값을 반환한다.

```js
const double = (v, f) => f(v*2);
double(2, console.log);
```

sync block

```js
const sum = n=> {
  let sum = 0;
  for(let i =1; i <=n; i++) sum += i;
  return sum;
};
sum(100);
```

sync non-block

하지만 이 로직은 안된다. blocking은 이번 프레임에서 되고 true는 다음 프레임에서 된다. 이걸 하기 위해선 while같은 감시기를 requestAnimationFrame에 또 태워서 감시기를 만들어야한다. 두개의 스레드가 돌면서 하나는 생성하고 하나는 감시해서 얻어오는 것을 suspension 패턴이라고 한다.

```js
const sum = n=> {
  const result = {isComplete: false};
  requestAnimationFrame(_=> {
    let sum = 0;
    for(let i = 1; i <= n; i++) sum += i;
    result.isComplete = true;
    result.value = sum;
  });
  return result;
};

const result = sum(100);
while(!result.isComplete); //이부분에서 안넘어간다. frame이 다음번으로 넘어가지 못하기 때문에.
console.log(result.value);
```

async block

```js
const sum = (n, f) => {
  let sum = 0;
  for(let i = 1; i <= n; i++) sum +=i;
};
sum(10, console.log);
console.log(123);
```

async nonblock

```js
const sum = (n,f) => {
  requestAnimationFrame(_=>{
    let sum = 0;
    for(let i = 1; i<= n;i ++) sum += i;
    f(sum);
  });
};
sum(10, console.log);
console.log(123);
```

얘는 requestAnimationFrame을 사용하여 바로 반환하여 nonblock이며 callback으로 반환하지만, 다음 프레임에 블록을 만들고 있다. 타임 슬라이스를 하던가 해야함.

왜 콜백을 쓸까 ?
값을 그냥 받으면 리턴받으면 처리하는 코드를 두번 짜야한다. callback같은 리스너를 만들면 처리하는 값이 캡슐화된다. 받는 쪽이 똑같으니까 콜백을 만드는거다. 그것을 캡슐화하기 위해서.

similar async-block
블록도 어싱크로 아닌데 어싱크 블록처럼 보이는 코드

```js
const sum = (n, f) => {
  requestAnimationFrame(_=>{
    let sum = 0;
    for(let i =1; i<=n; i++) sum +=i;
    f(sum);
  });
};
sum(100000000, console.log);
console.log(123);
```

```js
const backRun = (f, end, ...arg) => {
  const blob = new Blob([`
    onmessage =>e=> postMessage((${f})(e.data));
  `], {type: 'text/javascript'});
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  worker.onmessage = e=>end(e.data);
  worker.onerror = e=>end(null);
  worker.postMessage(arg);
}

const f = v => {
  for(let i = 1; sum = 0; i <=v[0]; i++) {
    sum += i;
  }
  return sum;
};

let i = 1000;
while(i--) backRun(f, console.log, 100000);
```

이건 백그라운드가 끝나고 리소스를 os에 반환해야하는데 계속 잡고 있어서 문제를 일으키는 녀석이다
이건 worker thread 패턴으로 처리한다.
한번에 동시에 실행시킬 수 있는 thread개수를 제약하고 나머지는 queue에 넣고 queue에서 해소되면 남은 thread에 넣어서 처리하도록 한것. 중간에 실행기가 껴있는 것이다.
