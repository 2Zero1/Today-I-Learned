# es6&degisn Patter&view Pattern

디자인 패턴이 갖는 철학과 기본 지식을 먼저 이야기해보자.

## GOF의 디자인패턴 종류

1. 생성 패턴: 객체를 만들때 어떻게 만들면 좋을지에 대한 패턴
2. 구조 패턴: 객체끼리 관계를 지을때 어떻게 관계를 지으면 좋을지에 대한 패턴
3. 행동 패턴: 알고리즘 문제를 객체간의 협력망을 통해 어떻게 풀면 좋을지에 대한 패턴

객체지향설계를 학습할 수 있는 부류로 캡슐화, 다형성, 변화율, 객체 관계, 역할 모델이 있다.

알고리즘이 변화하는 이유는? 비즈니스 변화, 연관 라이브러리 변화,호스트 측의 변화와 같은 대부분 통제 불가 요소들이다. 결국 변화를 막는건 불가능하다.

하지만 기존 제어문 기반의 알고리즘은 수정하면 전체가 컴파일 되는 문제가 발생한다. 이게 무슨 의미일까 ?

밑의 코드의 가장 상단의 if 부분만 바꾸면 밑의 else if 모두 다시 컴파일 해야하며 회귀테스트 해야한다.

```js
if(case == 1) {
  ...
}else if(case ==2) {
  ...
}else if(case ==3) {
  ...
}
```

알고리즘이 변화한 부분만 수정하고 나머지는 건드리고 싶지 않으면 최대한 개별 알고리즘을 함수로 분리하면 된다.

```js
if(case == 1) {
  case1();
}else if(case ==2) {
  case2();
}else if(case ==3) {
  case3();
}
```

하지만 위의 것도 문제는 아직 더 있다. 밑의 두 문제는 함수로 분리한다고 할지라도 기존의 제어문에서는 해결되지 않는다.

1. 경우가 변경되거나 늘어날 경우

```js
if(case == 1) {
  case1();
}else if(case ==2) {
  case2();
}else if(case ==3) {
  case3();
}else if(case ==4) { //이부분이 추가됨.
  case3();
}
```

2. 함수간 공통 부분

```js
if(case == 1) {
  common();
  case1();
}else if(case ==2) {
  common();
  case2();  
}else if(case ==3) {
  case3();
```

알고리즘 분화시(if 영어론 case) 객체지향에서 선택할 수 있는 두 가지 방법

1. 상속 위임: 공통된 경우인 common을 만들고 경우의 수만큼 자식 클래스를 만든다. 내부계약관계로 추상층에서 공통 요소를 해결하고 상태를 공유할 수 있다.

2. 소유 위임: 소유하는 애는 베이스를 그냥 두고 얘가 경우의 수에 맞는 4가지 객체를 소유함으로써 해결하는 방법. 외부 계약관계로 각각이 독립적인 문제를 해결하며 메세지를 주고 받는것으로 문제를 해결함.

GOF DP의 방향성은 소유 위임을 지향한다. 하지만 이건 type이 너무 많이 나온다.

## 상속위임

```js
const Github = class{   // 이 코드는 JSONP를 사용한 코드인데 cross domain에 대한 고민을 전혀 할 필요가 없다.   
  constructor(id, repo) {
    this._base = `https://api.github.com/repos/${id}/${repo}/contents/`;
  }
  load(path) {  // 이 함수가 (템플릿 메서드)이다.
    // 이부분 부터
    const id = 'callback' + Github._id++;
    const f = Github[id] = ({data:{content}}) =>{
      delete Github[id];
      document.head.removeChild(s);
      this._loaded(content); // 위임 부분 (실행 시점에 if로 분기해야 하는 부분인 것이다. 변화가 많고 경우의 수가 늘어날 수도 있음.)
    };
    const s = document.createElement('script');
    s.src = `${this._base + path}?callback=Github. ${id}`;
    document.head.appendChild(s);
    // 이부분 까지 공통 부분 (이 부분은 변화가 거의 일어나지 않을거다 라고 판단해서 나오게 된것임.)
  }
  _loaded(v){throw 'override!'}; // (HOOK)
};
Github._id = 0;
const ImageLoader = class extends Github {
  _loaded(v){...} //위임 구현 (HOOK)
}
```

jsonP

```js
const github = {}
github.callback0 = 
function a(data) {// 뒷정리를 해주는 부분
  delete github.callback0;
  document.removeChild(s)
  data // 여기서 data를 처리한다.
}
// <script src="http://naver.com/a.js?callback=a"></script>
s = document.createElement('script');
doc.head.appendChild(s);
s.src = '...?callback=github.callback0';
a({meta:{}, data:{contents:{}}})  //callback=a 로 사용할 경우 받는 경우
{meta:{}, data:{contents:{}}}     //callback을 사용하지 않을 경우 받는 경우
```

좀 더 코드를 작성해보자.

```js
cosnt ImageLoader = class extends Github{
  constructor(id, repo, target) {
    super(id, repo);
    this._target = target;
  }
  _loaded(v) {
    this._target.src = 'data:text/plain;base64,' + v;
    //data url 형식이 있다. 원래 url은 http로 시작된 것만 가능한데 말고 data url이라고 해서 직접 data를 base 64로 변경해서 넣을 수 있다. html5 스펙이다. base 64로 이미지 데이터가 날라오면 이미지 데이터 앞에 위와같이 써주면 image src에 넣었을때 그림이 보인다.
  }
}

const s75img = new ImageLoader(
  'hikamaeng',
  'codespitz75',
  document.querySelector('#a')
);
s75img.load('einBig.png');

const MdLoader = class extends Github{
  contructor(id, repo, target) {
    super(id, repo);
    this._target = target;
  }
  _loaded(v) {
    this._target.innerHTML = this._parseMD(v);
  }
  _parseMD(v) {
    return d64(v).split('\n').map(v=>{
      let i = 3;
      while(i--) {
        if(v.startsWith('#'.repeat(i + 1))) return `<h${i + 1}>${v.substr(i + 1)}</h${i + 1}>`;
      }
      return v;
    }).join('<br>');
  }
};
const d64 = v=>decodeURIComponent(
  atob(v).split('').map(c=>'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
);

const Github = class{   // 이 코드는 JSONP를 사용한 코드인데 cross domain에 대한 고민을 전혀 할 필요가 없다.   
  constructor(id, repo) {
    this._base = `https://api.github.com/repos/${id}/${repo}/contents/`;
  }
  load(path) {  // 이 함수가 (템플릿 메서드)이다.
    // 이부분 부터
    const id = 'callback' + Github._id++;
    const f = Github[id] = ({data:{content}}) =>{
      delete Github[id];
      document.head.removeChild(s);
      this._loaded(content); // 위임 부분 (실행 시점에 if로 분기해야 하는 부분인 것이다. 변화가 많고 경우의 수가 늘어날 수도 있음.)
    };
    const s = document.createElement('script');
    s.src = `${this._base + path}?callback=Github. ${id}`;
    document.head.appendChild(s);
    // 이부분 까지 공통 부분 (이 부분은 변화가 거의 일어나지 않을거다 라고 판단해서 나오게 된것임.)
  }
  _loaded(v){throw 'override!'}; // (HOOK)
};
Github._id = 0;
```

```js
// 정의시점
// 정의 시점엔 뭘 할지를 미리 만들어 놓지 않는다. 케이스 별로 처리할 처리기만 계속 분기해서 만들어 주는 것이다. 
// 이 점을 통해 함수 안에 if를 안 갖게 되고 바깥쪽에서 if를 분기하는 것이 부담이 되지만 대신 if가 더 늘어나도 변화해도 밖에서 대응할 수 있게 된것이다.
<script src="Github.js"></script>
<script src="ImageLoader.js"></script>
<script src="MdLoader.js"></script>

<script>
// 실행 시점 

const img = new ImageLoader(...);
img.load(...);

const md = new MdLoader(...);
md.load(...);
</script>
```

## 소유 위임

```js
const Github = class{   
  constructor(id, repo) {
    this._base = `https://api.github.com/repos/${id}/${repo}/contents/`;
  }
  load(path) {
    const id = 'callback' + Github._id++;
    const f = Github[id] = ({data:{content}}) =>{
      delete Github[id];
      document.head.removeChild(s);
      this._parser(content);    //위임 부분 
      // parser를 무엇을 갖고 있느냐에 따라 위임하는 부분에 처리내용이 달라진다. 위의 것처럼 상속을 통한 이미지 로더를 만들거나 md로더를 만드는게 아니라 md로더를 할 함수를 받아들이거나 이미지 로더 역할을 할 함수를 받아들이는 것만으로도 손쉽게 로직이 대체된다.
      //상속 모델에 비해 클래스 정의를 할 필요가 없다. 함수를 넘기면 되니까. 물론 전략 객체로 클래스로 만들게 되면 클래스 형으로 정의해서 넘겨줘야 하지만 함수로 보내면 오히려 클래스 생성 비용이 줄어든다. 대신 함수로 보낼때의 문제점은 그 함수의 안정성을 보장해야한다. 객체를 넘기면 타입으로 판별할 수 있다. 위의 두 의사결정은 얼마나 이게 신뢰가 필요한 코드인지에 따라 결정된다. 원자로의 온도를 결정한다면 무조건 타입이다. 위험할 수록 강타입을 사용하는것이다.
    };
    const s = document.createElement('script');
    s.src = `${this._base + path}?callback=Github. ${id}`;
    document.head.appendChild(s);
  }
  set _parser(v){this._parser = v}; // 위임 객체
};
Github._id = 0;
```

```js
const el = v=>document.querySelector(v);
const parseMD = v=>...;
const loader = new Github('hikaMaeng', 'codespitz75');

//img
const img =v=>el('#a').src = 'data:text/plain;base64,' + v;
loader.parser = img;
loader.load('xx.png');

//md
const md =v=>el('#b').innerHTML = parseMD(v);
loader.parser = md;
loader.load('xx.md' );
```

디자인 패턴에서 소유하고 있는 놈의 이름은 두가지이다. 하나는 host 또 다른 하나는 invoker(실행기)이다. 전략패턴에서 loader를 invoker라고 부르진 않는데 parser만 갈면 계속 실행할 수 있다. 그럼 계속 parser만 교체해서 쓸 수가 있다.

```js
const Github = class{   
  constructor(id, repo) {
    this._base = `https://api.github.com/repos/${id}/${repo}/contents/`;
  }
  load(path) {
    const id = 'callback' + Github._id++;
    const f = Github[id] = ({data:{content}}) =>{
      delete Github[id];
      document.head.removeChild(s);
      this._parser[0](content, ...this._parser[1]);    //위임 부분 
    };
    const s = document.createElement('script');
    s.src = `${this._base + path}?callback=Github. ${id}`;
    document.head.appendChild(s);
  }
  setParser(f, ...arg){this._parser = [f, arg];}
};
Github._id = 0;

const el = v=>document.querySelector(v);
const parseMD = v=>...;
const loader = new Github('hikaMaeng', 'codespitz75');

//img
const img =(v, el)=>el('#a').src = 'data:text/plain;base64,' + v;
loader.setParser(img, el('#a'));
loader.load('xx.png');

//md
const md =(v, el)=>el.innerHTML = parseMD(v);
loader.setParser(md, el('#b'));
loader.load('xx.md' );
```

```js
// 그래서 정의 시점을 위로 올렸다.
<script src="Github.js"></script>
<script src="ImageLoader.js"></script>
<script src="MdLoader.js"></script>

<script>
// 실행 시점 
const loader = new Github('hikaMaeng', 'codeapitz75');

loader.setParser(img, el('#a'));
loader.load('xx.png');

loader.setParser(md, el('#b'));
loader.load('xx.md'); 
</script>
```

위의 코드는 케이스별로 분기하는데 성공했을뿐 케이스를 분기하는 지식이 어디 가있지는 않다. 이 문제도 해결해야한다. 케이스 별로 완전히 독립된 로직을 짜는 방법은 배웠지만 그 케이스 자체를 분기하는 로직은 아직 존재한다.

실행 시점에 대한 관리를 할건데 실행 시점에 어떤 객체를 써야될지에 대한 위임 패턴을 만들것이다. 이것이 router이다. 거대한 케이스 처리기이다. spring mvc에서 라우팅 세팅할때 method와 url로 세팅하는데 어떤 method에 어떤 url에 들어오면 작동할거다 라고 사용한다. 이는 결국 거대한 case 문이다. method와 url을 건다는 조건이 정해져 있는것이다. 라우터 테이블이 일반적인 if와 다른 점은 if는 마구 넣을 수 있는데, router는 정해진 조건만 바라볼 수 있다. 그럼 if와 router를 짤때가 뭐가 다를까? if문 statement이지만, router는 값으로 되어져 있다. 케이스만큼의 값으로 되있기 때문에 코드를 안 건드리고 배열을 더 추가하는 것 처럼 얼마든지 추가할 수 있다. if를 제거할 순 없지만 값으로 바꿀 수 있다. hashmap이나 object를 사용하면된다.

js가 prototype을 쓰는 이유는 나한태 없는 키가 남한태 있는지 타고타고 찾아가서 찾아온다. prototype chain이라고 부른다. 이 객체에는 값이 없지만 체이닝 하고 있는 객체를 타고타고 찾아서 갖고온다. 이것이 바로 용량과 처리를 교환하는 행위이다. 해쉬 연산을 여러번 해서 찾아오는것이다. 연산을 여러번 하는 대신 공통 데이터를 한곳에 넣을 수 있으니 용량은 줋어든다.

```js
  const Loader = class{
    constructor(id, repo) {
      this._git = new Github(id, repo);
      this._router = new Map; //라우팅테이블
    }
    add(ext, f, ...arg) {
      ext.split(',').forEach(v=>this._router.set(v,[f, ...arg]));
    }
    load(v) {
      const ext = this._v.split('.').pop();
      if(!this._router.has(ext)) return;
      this._git.setParser(...this._router.get(ext));  //확장자 경우에 따라 자동분기
      this._git.load(v);
    }
  }

  //여기에 추가할 수록 if문을 추가하는 효과가 발생하는데 이것은 문이 아니라 값이기 때문에 무한히 추가해도 Loader의 코드를 수정할 필요가 없다.
  // if문을 제거하는것은 stradge 또는 template으로 처리했지만 실제로 분기하는 로직은 라우팅 테이블로 일반화 시켰다.

  const loader = new Loader('hikingMaeng', 'codespitz75');
  // 밑의 코드처럼 발생 가능한 경우의 수를 값으로 기술한것이다.
  loader.add('jpg,png,gif', img, el('#a'));
  loader.add('md', md, el('#b'));

  loader.load('xx.jpg');
  loader.load('xx.md');
```

상태에 대한 분기는 사라지지 않는다. 그 분기는 필요해서 태어났기 때문이다. 영화관에 할인 조건이 계속 변경되고 추가되고 삭제될탠데 이걸 어떻게 관리할 수 있을까?
정의 시점에 제거하는것이다! 변화하는 부분과 변화하지 않는 부분을 나눠서 변하지 않는 부분인 정의 부분에서 if를 제거하는 것이다.

if문을 제거하는 공식

1. 분기 수 만큼 객체를 만들고
2. 실행 시점에 경우의 수를 공급한다.

안에 있던 if문을 없애기 바깥에 if문 경우의 수만큼 객체를 만들어 공급해주고 바깥쪽에서 선택해서 넣어주면 된다. 그럼 if별로 분기하던 함수는 일반함수 처럼 실행기의 실행만 하는 코드로 바뀐다. if는 바깥쪽 선택기와 바깥쪽 객체로 빼준다. 이와 같이 하면 객체수만 많아지고 관리하기 힘들거라 생각할 수 있지만 변경과 추가에 유연함을 보인다.

### 실행 시점으로 분기를 옮길 때의 장단점

장점

1. ***정의 시점에 모든 경우를 몰라도 된다.***
2. 정의 시점에 그 경우를 처리하는 방법도 몰라도 된다.

일정한 통제 범위 내에서 확장가능한 알고리즘 설계가 가능하다.

단점

1. 실행 시점에 모든 경우를 반드시 기술 해야한다.
2. 실행 시점마다 알고리즘의 안정성을 담보해야한다.

매 호스트코드마다 안정성을 따로 담보 해야한다.

실행 시점을 감싸는 여러가지 캡슐화 패턴이 있다. Factory, builder Pattern.
실행 시점에 어떻게 분기하고 만들어낼지 분기해주는 패턴이다.