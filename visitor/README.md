# Visitor

이전 todo를 다시 생각해보면 data가 composite으로 되어 있는데 렌더러 또한 composite으로 되어져 있다.
composite은 task만 수행하고 실제 렌더러는 또 composite를 하지 않고(나 그리고 또 자식그리고 하지 않고) 순회는 알아서 시켜주고 방문해서 하고싶은것만 할래 이게 바로 visitor이다. 이전의 것은 task에서 composite 그리고 renderer에서 composite 두번 해야되며 중복이 발생한다. 이렇게 하면 실제로 두판 다 잘짜긴 힘들다. 그래서 data를 composite로 하고 task를 사용해서 활용하는 행동은 composite 로직을 제외하고 composite을 타고다니면서 그림만 그리도록 분리할것이다. 그래서 composite가 나오면 무조건 visitor가 나온다고 생각하면 된다. 함수형 foreach, map에 들어가는 함수가 visitor 패턴의 미니멀한 케이스이다.
visitor는 어떤 구조에 사용됬는지도 모른다. 그냥 불러준다면 그 상황에 대응해주는것 뿐이다.
우리는 composite를 순회하는 visitor를 만들려고 한다. 이 경우 visitor가 복잡할 이유는 없다. visitor를 composite 구조에 넣어주는 composite쪽이 복잡해 지는거지 visitor는 간다하다.

코드를 위한 유틸리티 함수들

```js
const sel = (v, el = document) => el.querySelector(v);
const el = (tag, ...attr) => {
  const el = typeof tag == 'string' ? document.createElement(tag) : tag;
  for(let i =0; i < attr.length;) {
    const k = attr[i++], v = attr[i++];
    if(typeof el[k] == 'function') el[k](...(Array.isArray(v) ? v : [v]));
    else if(k[0] == '@') el.style[k.substr(1)] = v;
    else el[k] = v;
  }
  return el;
};
const err = (v = 'invalid') => {throw v;};
const override = _ => err('override');
const prop = (t, p) => Object.assign(t, p);
const is = (t, p) => t instanceof p;

const d64 = v => decodeURIComponent(atob(v).split('').map(v => '%' + ('00' + c.charCodeAt(0).toString())));
```

```js
const Task = class {
  static title(a, b) { return a._title > b._title;}
  static date(a, b) { return a._date > b._date;}
  constructor(_title = err(), _date = new Date){
    prop(this, { _title, _date, _list: []});
  }
  get title() { return this._title;}
  get date() { return this._date.toUTCString();}
  add(task) {
    if(!is(task, Task)) err(); this._list.push(task);
  }
  remove(task) {
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  getResult(sort, stateGroup = true) {
    const list = this._list;
    return {
      item: this,
      children: (!stateGroup ? [...list].sort(sort) : [
        ...list.filter(v=>!v.isComplete()).sort(sort),
        ...list.filter(v=>v.isComplete()).sort(sort)
      ]).map(v=>v.getResult(sort, stateGroup))
    };
  }
  accept(sort, stateGroup, visitor) {
    visitor.start(sort, stateGroup, this); //visitor는 별거 안한다. start 불릴때 준 this를 처리하고 밑에서 end만 처리한다.
    this.getResult(sort, stateGroup).children.forEach(  //순환구조에 맞게 돌리는건 task 본인의 책임이다.
      ({item}) => item.accept(sort, stateGroup, visitor);
    );
    visitor.end();
  }
}
isComplete() { override(); }

// 하지만 이 밑의 둘은 결국 똑같다. 부모 계층인 task에서 자료구조를다 생성하기 때문에 getResult를 만드는 방법이 부모에 완전히 캡슐화되어 있기 때문에 자식에선 이 행동에 관여하지 않고 이 행동에 관여하지 않으니까 visitor 순회에도 관여하지 않고 따라서 자식에선 accept에 관여할 수 있는게 아무것도 없다.
const TaskItem = class extends Task {
  constructor(title, date) {
    super(title, date) {
      super(title, date);
      this._isComplete = false;
    }
    ifComplete() { return this._isComplete;}
    toggle() { this._isComplete = !this._isComplete;}
  };
};
const TaskList = class extends Task {
  constructor(title, date) { super(title, date);}
  isComplete(){}
};
```

이 렌더러는 그림을 그리는 일반적인 로직은 다 갖고 있고, 구체적인 그림을 그리는 로직은 visitor에 넘길것이다. 따라서 renderer를 만들고 나면 renderer의 자식도 필요가 없다. renderer의 역할은 task과 협력하여 task에 대한 그림을 그릴 수 있게 visitor를 중개하는 행위이다. 이젠 renderer의 자식도 필요 없다는 얘기이다. renderer가 분할된 이유는 DOM이나 다른 종류로 그리기 위해서였는데 이젠 그 역활을 visitor에게 나눠주면서 renderer는 task과 협력만 하고 중개만 잘해주면 된다. 그래서 내부의 dom에 관련된 것들이 모두 없어졌다.

```js
const Renderer = class{
  constructor(_list = err(), _visitor = err()) {
    prop(this, { _list, _visitor: prop(_visitor, { renderer: this}), _sort: 'title'});  //이 코드를 보면 visitor에 renderer를 알게 되는데, 밑의 add, remove 등의 행위들을 모두 renderer에 위임하기 위함이다.
  }
  add(parent, title, date) {
    if (!is(parent, Task)) err();
    parent.add(new TaskItem(title, date));
    this.render();
  }
  remove(parent, task) {
    if(!is(parent, Task) || !is(task, Task)) err();
    parent.remove(task);
    this.render():
  }
  toggle(task){
    if(!is(task, TaskItem)) err();
    task.toggle();
    this.render():
  }
  render() {
    this._visitor.reset();
    this._list.accept(Task[this._sort], true, this._visitor); //list가 배열이라고 생각하면 배열의 foreach에 함수를 넣는것과 유사하다.
  }
}
```

렌더러는 visitor를 소유하고 있다가 list한태 그림을 그리는 순간 visitor를 배포하는 역할을 하고 이것을 순회하는 책임은 task가 갖는다. task가 순회를 하면서 visitor를 자기 노드에 넣어 위 임하는것이다. 그래서 위의 render에 dom에 대한 로직이 모두 없어진것이다.

```js
const Visitor = class {
  set renderer(v) { this._renderer = v;}
  reset() { override(); }
  start(task) { override(); }
  end() { override(); }
}

accept(sort, stateGroup, visitor) {
  visitor.start(sort, stateGroup, this);
  this.getResult(sort, stateGroup).children.forEach(
    ({ item }) => item.accept(sort, stateGroup, visitor)
  );
  visitor.end();
}
render() {
  this._visitor.reset();  //이 리셋을 라이프 사이클이라한다. 어떤 객체가 어떤 단계별로 실행될때 실행되는 단계가 확정되어 있다면 그것을 라이프사이클이라고한다. visitor 패턴의 라이프 사이클은 reset후에 start와 end를 반복한다라고 얘기할 수 있다.
  this._list.accept(Task[this._sort], true, this._visitor);
}
```

composite 로직은 이제 중복이 제거되고 task에만 있다. visitor는 순회를 돌려주면 그림만 그리게 된다. 본인 자체가 visitor가 되도 되지만 visitor 객체를 분리해주었다. 이유는 변화율 떄문이다. 렌더러 로직은 변화될 확률은 거의 없고 Domvisitor는 폰트나 뭘 조금만 변경해달라고 해도 바뀐다. domvisitor를 바꾸는 이유는 보이는게 마음에 안들어서 인데 renderer를 바꾸는 이유는 task의 자료구조에 근본적인 구조가 변경됬을때 바뀐다. 변화하는 이유가 다른것이다. 그 이유가 역할이다.

```js
const DomVisitor = class extends Visitor {
  constructor(_parent) {
    super();
    prop(this, { _parent });
  }
  reset() {
    this._current = el(sel(this._parent), 'innerHTML', '');
  }
  start(sort, stateGroup, task) {
    if(!is(this._renderer, Renderer)) err();
    switch(true) {
      case is(task, TaskItem): this._item(task); break;
      case is(task, TaskList): this._list(task); break;
    }
    this._current = this._current.appendChild(el('section',
      '@marginLeft', '15px',
      'appendChild', el('input', 'type', 'text'),
      'appendChild', el('button', 'innerHTML', 'addTask',
        'addEventListener', ['click', e => this._renderer.add(task, e.target.previousSibling.v)])
    ));
  }
  end() {
    this._current = this._current.parentNode;
  }

  _list(task) {
    this._current.appendChild(el('h2', 'innerHTML', task.title));
  }
  _item(task) {
    [el('h3', 'innerHTML', task.title,
        '@textDecoration', task.isComplete() ? 'line-through' : 'none'),
    el('time', 'innerHTML', task.date, 'datetime', task.date),
    el('button', 'innerHTML', task.isComplete() ? 'progress' : 'complete',
      'addEventListener', ['click', _=> this._renderer.toggle(task)]
    ),
    el('button', 'innerHTML', 'remove',
        'addEventListener', ['click', _=>this._renderer.remove(parent, item)])
    ].forEach(v=>this._current.appendChild(v));
  }
}
```

이 visitor가 결국 view가 되는것이다. 결국 visitor가 renderer를 안 이유는 사실 컨트롤러를 물고 들어온 것이다. 왜냐면 데이터 구조를 알고 있는 책임은 renderer가 알고 있고 visitor는 돌려주면 그리는 책임만 갖는애이다. 이건 model과 view를 동시에 소유하고 있는 renderer만이 알고 있다. renderer에게 의뢰해야만 바르게 처리할 수 있다.

위의 visitor에선 start와 end 로 오퍼레이션이 두개 있는데, 검색하고 끝나는 경우엔 한개만 있어도 상관 없다. 디자인패턴에선 진짜 액션을 처리하는 애들을 operation이라고 퉁쳐서 부른다.

```js
accept(sort, stateGroup, visitor) {
  visitor.start(sort, stateGroup, this);  // 여기와
  this.getResult(sort, stateGroup).children.forEach(
    ({ item }) => item.accept(sort, stateGroup, visitor)
  );
  visitor.end();  //여기 부분에 대한 순서를 꼭 지켜줘야한다는 말도안되는 상황이 아직 남아있다.
}
render() {
  this._visitor.reset();
  this._list.accept(Task[this._sort], true, this._visitor);
}
```

위의 문제는 operation 사용에 대한 제약을 강제할 수 없다. 이문제는 역활 중복에서 태어난 것이다. 원래 task는 composite 자료 구조체인데 왜 visitor를 감당하는 문제를 갖고 있는걸까? visitor에 대한 지식이 없는데 visitor를 제어하려니까 힘든거다. visitor를 컨트롤 하려고 하면 외부에 공개된 시그니처를 알 수 있는데 하지만 행위라는건 세바퀴 돌고 다섯발자국 가는거랑 다섯 발자국 가고 세바퀴 도는거랑 완전히 다르다. 세바퀴 돌아와 다섯 발자국 가라는 메서드를 갖는다고 해결될 문제가 아니다. 이것들은 구체적인 사용방법이 정해져있다. 사용 방법은 그 행위를 소유한 애만 알고 있는 것이다. 절차, 용도, 방법, 위치는 모두 걔만 알고 있는 것이다. visitor에 대한 지식이 없는데 visitor의 공개 메서드만 사용할 수 있다고 해서 얘가 visitor를 제대로 사용할 수 있는것은 아니다. 무조건 실패한다. visitor에 대한 지식이 없는데 visitor를 처리하는 로직을 composite이 갖고 있는것 자체가 문제인 것이다. 그러다보니 역할이 중복되어 있다는 증거가 코드 안에 있는데 그건 바로 accept 안에 getResult가 있다는 것이다. accept가 composite를 도는데 얘가 composite을 돌기 위해서 안의 composite를 다시 재활용 하고 있는것이다. composite이 2단으로 중복된것이다.  accept도 composite을 도는데 getResult도 composite를 돌고 있는것이다. 따라서 getResult의 composite이 바뀐게 내가 accept한 방식과 마음에 안들면 두가지 composite를 따로 관리하게 되서 getResult가 아니라 전용 getResult를 또 만들어야될 수도 있다. 위의 코드는 암묵적으로 자기 메서드에 의존하고 있어서 문제가 없어 보이지만 accept가 기대하는 composite 회전과 getResult가 기대하는 composite 회전이 다를 수 있다는 것이다. 원래부터 용도(역할)이 다르기 때문이다. 남들이 나한태 getResult를 요구할때 대응하는 것과 accept를 받아들였을때 내가 대응해야하는 기대가 다르다. 이게 내부 중복이다. 역할이 다른 메서드가 다른 역활의 메서드를 참조하고 있어 오염된것이다. 이 문제는 task가 2가지 역할을 수행하고 있기 때문에 발생한다. accept를 받아들이는 visitor를 loop돌리는 역할과 원래 composite로서의 자료구조의 역할 이 두개를 동시에 수행하고 있기 때문에 역할 중복에 대해 이런 문제가 발생한다. 위의 코드는 조금만 변경해도 그냥 버그다. start와 end의 transaction을 보장할 수 있는 방법도 없고 getResult가 내부역할을 참조해서 중복된 역할을 수행하고 있다는 것이 눈에 보인다

위의 문제를 대응하기 위해 accept 쪽에서 visitor를 사용하는 지식을 갖기 싫어서 reverse visitor를 사용한다.

## reverse visitor

visitor에 대한 지식을 visitor가 소유할 수 있는 방법이 생긴다. render 메서드를 보면 list를 기준으로 list가 visitor를 처리하는 역할을 갖기 때문에 list에게 accept 메서드를 통해 visitor를 보내고 있다. 이 코드가 list가 visitor를 처리할 책임을 져야한다고 보여주고 있다. visitor를 다루는 방법을 list가 알고 있다. 그럼 visitor가 변하면 task가 깨지는 현상이 일어난다. 따라서 visitor의 역할은 visitor가 알아야하고 list는 getResult를 공급하는 역할만 해야한다. list가 visitor의 역할을 수행하면 안되고 visitor의 역할은 visitor에게 list는 오직 getResult만 수행해야한다. mvc 프레임 워크가 어려운 이유가 이 이유 때문이다. 이런 미세한 분할로 클래스들이 계층 분할 되기 때문이다. spring을 배우든 angualr를 배우든 이 미세한 역할 분리를 해서 구분하는데 성공하지 않으면 걔가 왜 있는지 모르니까 만들기 위해선 그냥 클래스 여러개 만드는것밖에 못한다. 하나의 역할이 단일 역할을 가져야 하고 다른애와 역할을 분리해서 어떻게 대화해야되는지 잘 훈련하지 않으면 영원히 똑같다.

다시 돌아와서 어떻게 reverse visitor로 바꿀 수 있을까? list가 accept 하는게 잘못됬다고 깨닳으면 바로 바꿀 수 있다.

```js
render() {
  this._visitor.reset();
  this._list.accept(Task[this._sort], true, this._visitor);
}
render() {
  this._visitor.reset();
  this._visitor.operation(Task[this._sort], true, this._list);  // visitor가 list를 받아들여야 하는것이었다. 왜냐면 list는 충분히 getResult라는 정보를 제공하고 있기 때문에 visitor가 list를 composite로서 받아들이고 visitor에 대한 지식을 visitor가 가져가면된다.
}

const Visitor = class{
  set renderer(v) { this._renderer = v; }
  reset() { override(); }
  operation(sort, stateGroup, task) { // operation이 거꾸로 task를 받아들인다. 이유는 task에 대한 이유가 getResult로 한정되어 있기 때문이다. 만약 task가 다른 방식의 result를 주는 지식이 생긴다면 그건 당연히 visitor가 알아야한다. visitor가 getResult를 통해서 composite를 획득하는 지식은 원래부터 task의 역할이다. 대신 여기선 visitor가 구상 클래스인 task와 단단히 바인딩되는 의존성이 생겼다.
  // 이전의 visitor에선 task라는 애를 전혀 모르고 태스크가 돌아갈떄 어떻게 처리할지만 알면 된다. visitor를 알아야하는 책임이 task에게 가는것이다.리스트가 거의 안변하고 visitor의 형태가 똑같은데 visitor가 많으면 이게 유리하다.

  //하지만 이 경우엔 visitor가 task의 사용법을 알고 있으며 모든 visitor는 결국 이 task밖에 바인딩이 안된다는 이야기다. 다른 자료구조가 올 수 없다는 이야기다. 이 자료구조 한정으로 어떻게 동작해야하는지의 구체적인 지식을 visitor가 소유한다. 한쪽이 정답이 아니라 visitor가 옳은 경우와 reverse visitor가 옳은 경우가 있다.
    this._start(sort, stateGroup, task);
    task.getResult(sort, stateGroup).children.forEach(
      ({item}) => this.operation(sort, stateGroup, item)
    );
    this._end();
  }
}
_start(task) { override(); }
_end() { override(); }
```

이렇게 까지 역할을 분리해도 뭔가 이상하다. 밑의 코드의 add, remove, toggle에 있는 render() 부분이 뭔가 마음에 안든다. add, remove, toggle은 데이터(모델)에 대한 변경이다. 그러면 parent가 add, remove, toggle 하면 진짜 할까 ? Task 클래스를 보면 err()로 throw 던지는 경우도 있다. task의 코드는 add,remove를 호출했다고 add가 된걸 확정 지을 수 없다는 것이다. 이걸 아는걸 Task만 알고 있다. 그럼 성급하게 add를 호출했다고 render를 호출해도 되는건가 ? 모델이 변했는지 알지도 못하는데..? 이게 거슬린다는 것이다. model이 변경된건 model만 알고 있다. 근데 renderer는 그걸 모델이 변경 됬는지 어떻게 안다고 render()를 떄린거지 ? 그렇다고 add가 성공했는지 물어볼 수도 없다. 캡슐화 되어있기 때문이다. 그럼 어떻게 하지 ?

모델에게 요청했는데 모델의 변화가 일어난건 모델만 알고 있으며 자기의 변화가 일어났다는걸 바깥으로 통제할 방법이 필요하다. 그럴때 Observer 패턴을 사용한다.

```js
const Renderer = class{
  constructor(_list = err(), _visitor = err()) {
    prop(this, { _list, _visitor: prop(_visitor, { renderer: this}), _sort: 'title'});  //이 코드를 보면 visitor에 renderer를 알게 되는데, 밑의 add, remove 등의 행위들을 모두 renderer에 위임하기 위함이다.
  }
  add(parent, title, date) {
    if (!is(parent, Task)) err();
    parent.add(new TaskItem(title, date));
    this.render();  
  }
  remove(parent, task) {
    if(!is(parent, Task) || !is(task, Task)) err();
    parent.remove(task);
    this.render():
  }
  toggle(task){
    if(!is(task, TaskItem)) err();
    task.toggle();
    this.render():
  }
}
```

Observer는 구독자, subject는 신문사라고 생각하면 된다. 그래서 신문을 뿌리는 행위를 notify라고 한다. 구독하려면 add 해지는 remove. set에 등록하면 중복된 observer를 검사하지 않아도 한번에 하나만 등록된다.

observer를 만드는 요령은 일단 observe에 인자를 보내지 말고 시작한다. 대부분의 observer는 통지만으로 충분한 경우가 많다. 그러면 쓸대없는 값이 배포되지 않아 동기화 문제도 않일어나고 멀티스레드 문제도 일어나지 않는다. 대부분 통지만으로 충분하다.

```js
const Observer = class{
  observe(){override();}
};
const Subject = class{
  constructor(){
    this._observers = new Set;
  }
  addObserver(o){
    if(!is(o, Observer)) err();
    this._observers.add(o);
  }
  removeObserver(o){
    if(!is(o, Observer)) err();
    this._observers.delete(o);
  }
  notify(){
    this._observers.forEach(o=>o.observe());
  }
}
```

밑은 구상 observer이고 대부분의 언어는 상속을 하나만 받을 수 있다. 하지만 task는 observer이기도 하고 subject이기도 하다. 이런 경우는 어떻게 할까? 상속을 하고 또 상속을 하는 계층 구조로 가던가 아니면 상속하고, 소유로 가는 방법이 있다. 이렇게 하면 다수의 소유를 통해 다중 상속의 문제를 해결할 수 있다. task는 모델의 변화를 외부에 통지하는 역할이 주된 역할이므로 subject를 상속받는다. 그리고 observer를 등록하는 이유는 자식의 변화를 자신이 알아차리기 위해서 자기가 자신의 observer가 되야한다. 할일 안에 할일이 생기면 이 변화를 부모에게 통지 해야지만 부모가 다시 그 부모에 통지하고 최종적으로 이 부모를 알고 있는 renderer에게 통지할것이다. 안그러면 최종에 있는 list의 변화를 renderer가 통지를 받겠지만 list 안에 있는 자식들의 변화는 renderer가 통지를 받을 수 없다. 모든 자식들의 변화를 renderer가 통지를 받기 위해선 자식을 추가할때 부모가 반드시 자식을 listening 하고 있어야한다. 자식이 변화가 일어나면 부모한태 알려줄거고 부모는 다시 그 부모한태 알려줄거고 그 부모는 최종적으로 렌더러에게 알려줄것이다. 이 task는 subject이자 동시에 observer이기도 하다.

```js
const TaskObserver = class extends Observer{
  constructor(_task) {  //얘는 생성할때 task를 가지며 소유모델이기 때문이다. 이 task를 가지고 notify를 해준다. 내가 자식한태 통보를 받으면 나도 부모한태 통보를 한다는 의미이다. notify를 중개해주는 observer인 것이다.
    super();
    prop(this, {_task});
  }
  observe(){
    this._task.notify();
  }
}
```

```js
const Task = class extends Subject {
  static title(a,b) { return a._title > b._title;}
  static date(a,b) { return a._date > b._date;}
  constructor(_title = err(), _date = new Date){
    super();
    prop(this,{_title, _date, _list: [], _observer: new TaskObserver(this)}); //내 자신을 참조로 하는 TaskObserver가 있다. 이부분이 소유인 것이다. 직접 observer를 구현하진 않았지만 나를 알고 있는 observer를 소유함으로써 observer에 대응할 수 있게 되었다. 
  }
  get title() { return this._title;}
  get date() { return this._date.toUTCString;}
  add(task) { // 자식을 넣는건데, 나도 내 자식의 observer가 되야한다. 그래서 밑으로
    if(!is(task, Task)) err();
    this._list.push(task);
    task.addObserver(this._observer); // 그래서 여기서 나는 observer가 아니기 때문에 observer가 나를 알게 만들어서 taskObserver를 여기에 넣어주고 있는것이다. 그럼 자식이 변화가 생겼을때 얘가 통지를 받으니 나에 있는 notify를 부를것이다. 자식의 toggle이 변하면 결국 taskObserver가 받게되는데 그러면 걔가 알고 있는 task에 notify를 호출하는데 그 task는 나 자신인 것이다. 결국 나의 notify가 호출되는것이다. 자식이 변하면 나의 notify가 호출되는 것이다.
    this.notify();
  }
  remove(task) {
    const list = this._list;
    if(!list.includes(task)) err();;
    list.splice(list.indexOf(task), 1);
    task.removeObserver(this._observer);
    this.notify();
  }
  getResult(sort, stateGroup = true) {
    const list = this._list;
    return {
      item: this,
      return {
        children: (!stateGroup ? [...list].sort(sort) : [
          ...list.filter(v => !v.isComplete()).sort(sort),
          ...list.filter(v=>v.isComplete()).sort(sort)
        ]).map(v=>v.getResult(sort, stateGroup))
      };
    }
    isComplete() { override(); }
  }
};

const Observer = class{
  observe(){override();}
};
const Subject = class{
  constructor(){
    this._observers = new Set;
  }
  addObserver(o){
    if(!is(o, Observer)) err();
    this._observers.add(o);
  }
  removeObserver(o) {
    if(!is(o, Observer)) err();
    this._observers.delete(o);
  }
  notify(){
    this._observers.forEach(o=>o.observe());
  }
};

const TaskObserver = class extends Observer{
  constructor(_task) {
    super();
    prop(this, {_task});
  }
  observe(){
    this._task.notify();
  }
}
```