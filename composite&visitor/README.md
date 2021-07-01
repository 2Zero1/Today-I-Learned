# composite&visitor

동일한 구조의 반복(iteration) -> ITERATOR PATTERN

알고리즘 전개에 따른 반복(recursion) -> Composite, visitor Pattern

컴포지트 패턴을 이해한다는 것은 재귀 호출을 이해한다는 것이다. 프런트엔드로 좌측 트리를 예를 들 수 있는데, depth가 계속 늘어나는 경우에 컴포지트 패턴을 이용한다. 그냥 알고리즘으로 구현할 경우 재귀 함수로 구현하려고하면 함수(함수는 상태를 갖고 있지 않아서 요구사항이 들어올때마다 함수 인자가 계속 늘어난다.) 론 힘들다. 그래서 객체화 시켜서 재귀하는것 자체를 감추는 것이 composite 패턴이다.

앱의 화면을 보고 데이터가 어떻게 생겼을까를 고민해보는 훈련을 해야함. 이것이 도메인을 파악하는 훈련 방법이다.
도메인을 파악하는 방법중 데이터베이스로 부터 온 방법론에는 그 행위를 명사로 표현할 수 있는 것과 동사로 표현할 수 있는것으로 나뉜다. 명사는 entity라는 표현을 쓰고 동사를 behavior라는 표현을 사용한다.  entity라고 표현하는 애들은 데이터 저장과 관련이 있다.
데이터베이스에서 entity가 테이블로 환원되는데 비해서 객체지향에선 하나하나 클래스가 되고 인스턴스로 된다.

사용할 코드부터 작성해라 !

```js
const list1 = new Task('테스트');
list1.add('지라설치');
list1.add('지라클라우드접속');

const list2 = new TaskList('s75');
list1.add('2강 답안 작성');
list1.add('3강 교안 작성');

console.log(list1.byTitle());
console.log(list2.byDate());
```

entity를 파악하는 요령은 최대한 의존성이 없는것부터 파악해라!

```js
const Task = class{
  constructor(title, date) {
    if(!title) throw 'invalid title';
    this._title = title;
    this._date = date;
    this._isComplete = false;
  }
  isComplete(){return this._isComplete;}
  toggle(){this._isComplete = !this._isComplete;}
  sortTitle(task){
    return this._title > task._title;
  }
  sortDate(task) {
    return this._date > task.date;
  }
};
const taskSort = {
  title: (a,b)=>a.sortTitle(b),
  date: (a,b)=>a.sortDate(b),
}

const TaskList = class{
  constructor(title){
    if(!title) throw 'invalid title';
    this._title = title;
    this._list = [];
  }
  add(title, date = Date.now()){this._list.push(new Task(title, date));}
  remove(task){
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  byTitle(stateGroup = true){return this._getList('title', stateGroup);}
  byDate(stateGroup = true){return this._getList('date', stateGroup);}
  _getList(sort, stateGroup) {
    const list = this._list, s = taskSort[sort];
    return !stateGroup ? [...list].sort(s): [
      ...list.filter(v=>!v.isComplete()).sort(s),
      ...list.filter(v=>v.isComplete()).sort(s)
    ];
  }
}
```

객체지향엔 은닉과 캡슐화가 있다. 은닉은 의미와 같이 감춘다는말이다. _변수는 밖에 안보여준단 것이다. 캡슐화는 외부에 행동을 추상적으로 표현 한다는것이다. ATM에서 돈뽑을때를 예로들 수 있다.

```js
const list1 = new Task('테스트');
list1.add('지라설치');
list1.add('지라클라우드접속');

const list2 = new TaskList('s75');
list1.add('2강 답안 작성');
list1.add('3강 교안 작성');

const list = list2.byDate();
list[1].task.add('코드정리');
list[1].task.add('다이어그램정리);

console.log(list2.byDate()[1].sub);
```

현상을 보고 데이터의 구조를 생각해 내는것을 모델링이라고 한다.

이제 task에도 자식이 생길 수 있다.

```js
const Task = class{
  constructor(title, date) {
    if(!title) throw 'invalid title';
    this._title = title;
    this._date = date;
    this._isComplete = false;
    this._list = [];
  }
  add(title,  date = Date.now()){this.push(new Task(title, date));}
  remove(task){
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  _getList(sort, stateGroup){
    const list = this._list, s = taskSort[sort];
    return {
      task: this,
      sub:!stateGroup ? [...list].sort(s) : [
        ...list.filter(v=>!v.isComplete()).sort(s),
        ...list.filter(v=>v.isComplete()).sort(s),
      ]
    }
  }
  isComplete(){return this._isComplete;}
  toggle(){this._isComplete = !this._isComplete;}
  sortTitle(task){
    return this._title > task._title;
  }
  sortDate(task) {
    return this._date > task.date;
  }
};
const taskSort = {
  title: (a,b)=>a.sortTitle(b),
  date: (a,b)=>a.sortDate(b),
}

const TaskList = class{
  constructor(title){
    if(!title) throw 'invalid title';
    this._title = title;
    this._list = [];
  }
  add(title, date = Date.now()){this._list.push(new Task(title, date));}
  remove(task){
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  byTitle(stateGroup = true){return this._getList('title', stateGroup);}
  byDate(stateGroup = true){return this._getList('date', stateGroup);}
  _getList(sort, stateGroup) {
    const list = this._list, s = taskSort[sort];
    return !stateGroup ? [...list].sort(s): [
      ...list.filter(v=>!v.isComplete()).sort(s),
      ...list.filter(v=>v.isComplete()).sort(s)
    ];
  }
}

const TaskList = class{
  constructor(title){
    if(!title) throw 'invalid title';
    this._title = title;
    this._list = [];
  }
  add(title, date = Date.now()){this._list.push(new Task(title, date));}
  remove(task){
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  byTitle(stateGroup = true){return this._getList('title', stateGroup);}
  byDate(stateGroup = true){return this._getList('date', stateGroup);}
  _getList(sort, stateGroup) {    // 이것은 private으로 표현한 것처럼 task 본인이 알아야함. list가 이걸 만들려면 task의 내장을 다 까야함. list와 task 사이의 내부거래이다. 왜냐면 바깥 코드에선 보이지 않기 때문이다.
    const list = this._list, s = taskSort[sort];
    return (!stateGroup ? [...list].sort(s): [
      ...list.filter(v=>!v.isComplete()).sort(s),
      ...list.filter(v=>v.isComplete()).sort(s)
    ]).map(v=>v._getList());  //list는 실제로 task가 어떻게 올지 모른다. 단지 표현하라고 tast에게 위임을 하고 있다.
  }
}
```

무한 뎁스 todolist에 대해 알아보자

```js
const list1 = new TaskList('s75');
const item1 = new TaskList('3강교안작성');
list1.add(item1);
const sub1 = new TaskItem('코드정리');
item1.add(sub1);
const subsub1 = new TaskItem('subsub1');
sub1.add(subsub1);

list1.getResult(Task.title);

{item: 's75',
  children:[
    {item:taskItem('3강교안작성'),
    children:[
      {item:taskItem('코드정리'),
      children:[
        {item:taskItem('subsub1'),
        children:[]}
      ]}
    ]}
  ]
}

const Task = class{
  static title(a,b){return a.sortTitle(b);}
  static date(a,b){return a.sortDate(b);}
  constructor(title) {
    if(!title) throw 'invalid title'; else this._title = title;
    this._list = [];
  }
  add(title,  date = Date.now()){this.push(new Task(title, date));}
  remove(task){
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  getResult(sort, stateGroup){
    const list = this._list;
    return {
      item: this._getResult(),
      children:(!stateGroup ? [...list].sort(s) : [
        ...list.filter(v=>!v.isComplete()).sort(s),
        ...list.filter(v=>v.isComplete()).sort(s),
      ]).map(v=>v.getResult(sort, stateGroup))
    };
  }
  _getResult(){throw 'override';}
  _isComplete(){throw 'override';}
  _toggle(){throw 'override';}
  _sortTitle(task){throw 'override';}
  _sortDate(task){throw 'override';}
};

```

위에서 보는것 처럼 재귀가 발생하는데, 그러므로 컴포지트 패턴은 depth가 깊으면 stack overflow를 일으키기가 쉽다.
***composite 패턴의 핵심은 함수의 이름을 똑같은걸 불러서 문제를 해결한다.*** 자기 자신에 대한 메서드를 반복해서 호출한게 아니라 자기와 자기 자식들것들을 똑같은 메서드로 부른것이다. composite 패턴이라고 알 수 있는 포인트는 getResult 메서드에서 getResult를 부르고 있는걸로 알 수 있다.

아깐 리스트에도 있던 코드가 item에도 있었는데 지금은 중복이 다 없어진걸 확인할 수 있다.

```js
const TaskItem = class extends Task{ 
  constructor(title, date = Date.now()) {
    super(title);
    this._date = date;
    this._isComplete = false;
  }
  _getResult(sort, stateGroup){ return this; }
  isComplete(){return this._isComplete;}
  sortTitle(task){return this._title > task._title;}
  sortDate(task){return this._date > task._date;}
  toggle(){this._isComplete = !this._isComplete;}
}

const TaskList = class extends Task{
  constructor(title){super(title);}
  _getResult(){return this._title;}
  isComplete(){}
  sortTitle(){return this;}
  sortDate(){return this;}

  byTitle(stateGroup = true){return this.getResult(task.title, stateGroup);}
  byDate(stateGroup = true){return this.getResult(task.date, stateGroup);}
}
```

데이터가 composite으로 되어 있다면 사용하는 쪽(렌더러)도 composite로 되어져 있어야한다.

```js
const el = (tag, ...attr) => {
  const el = document.createElement(tag);
  for(let i = 0;i < attr.length;) {
    const k = attr[i++], v = attr[i++];
    if(typeof el[k] == 'function') el[k](...(Array.isArray(v) ? v : [v]));
    else if(k[0] == '@') el.style[k.substr(1)] = v;
    else el[k] = v;
  }
  return el;
}

const Task = class{
  static title(a,b){return a.sortTitle(b);}
  static date(a,b){return a.sortDate(b);}
  constructor(title) {
    if(!title) throw 'invalid title'; else this._title = title;
    this._list = [];
  }
  add(title){if(task instanceof Task) this._list.push(task); else throw 'invalid';}
  remove(task){
    const list = this._list;
    if(list.includes(task)) list.splice(list.indexOf(task), 1);
  }
  getResult(sort, stateGroup){
    const list = this._list;
    return {
      item: this._list,
      children:(!stateGroup ? [...list].sort(s) : [
        ...list.filter(v=>!v.isComplete()).sort(s),
        ...list.filter(v=>v.isComplete()).sort(s),
      ]).map(v=>v.getResult(sort, stateGroup))
    };
  }
  isComplete(){throw 'override';}
  sortTitle(){throw 'override';}
  sortDate(){throw 'override';}
};

const TaskItem = class extends Task{ 
  constructor(title, date = Date.now()) {
    super(title);
    this._date = date;
    this._isComplete = false;
  }
  isComplete(){return this._isComplete;}
  sortTitle(task){return this._title > task._title;}
  sortDate(task){return this._date > task._date;}
  toggle(){this._isComplete = !this._isComplete;}
}

const TaskList = class extends Task{
  constructor(title){super(title);}
  isComplete(){}
  sortTitle(){return this;}
  sortDate(){return this;}

  byTitle(stateGroup = true){return this.getResult(task.title, stateGroup);}
  byDate(stateGroup = true){return this.getResult(task.date, stateGroup);}
}
```

renderer

```js
const DomRenderer = class{
  constructor(list, parent) {
    this._parent = parent;
    this._list = list;
    this._sort = Task.byTitle;
  }
  add(parent, title, date){
    parent.add(new TaskItem(title, date));
    this.render();
  }
  remove(parent, task){
    parent.remove(task);
    this.render():    
  }
  toggle(task){
   if(task instanceof TaskItem){
     task.toggle();
     this.render();
   }   
  }
}
```

증분렌더: 행위의 합으로 그려짐. 히스토리에 의해 그려진다는 것임.

모델렌더: 데이터를 그대로 그림

다지우고 다시 그리는게 너무 오래걸릴것 같다면 리액트 같은애 시키면 알아서 증분계산해서 똑똑하게 업데이트 한다. 우리가 할일이 아니다.

렌더 로직은 한판만 짜면 된다. 나의 리스트를 기준으로 해서 컴포지션의 데이터를 돌면서 그림을 그리는것 딱 하나만 짜면 된다.

배열을 하나의 차원으로 줋이고 싶다면 리듀스를 사용한다.
하나의 정수를 여러개 묶으면 집합이 된다. 이 집합을 표현한게 대표적으로 벡터이다. 벡터에는 여러 요소를 가질 수 있다. 그럼 우린 어떤 하나의 값을 벡터화 시킬 수 있고 벡터를 다시 묶어서 하나의 값으로 바꿀 수 있다. 어떻게 하면 하나의 값으로 바꿀 수 있을까? 평균 합 곱 을 하면 하나로 바뀐다. 원소가 여러개인 그룹을 하나의 값으로 바꿀 수 있다. 

```js
render(){
  const parent = this._parent;
  parent.innerHTML = '';
  parent.appendChild('title,date'.split(',').reduce((nav,c) =>(
    nav.appendChild(
      el('button', 'innerHTML', c,
        '@fontWeight', this._sort == c ? 'bold' : 'normal',
        'addEventListener', ['click', e=>(this._sort = Task[c], this.render())])
      ), nav
  ),el('nav')));  //위에는 도입함수로 초기화만 해준다. 실제 루프에 해당되는 컴포지션이 들어갈땐 
  this._render(parent, this._list, this._list.getResult(this._sort), 0);  //컴포지션 함수에 위임하게 된다.
}

_render(base, parent, {item, children}, depth) {
  const temp = [];
  base.style.paddingLeft = depth * 10 + 'px';
  if(item instanceof TaskList) {
    temp.push(el('h2', 'innerHTML', item._title));
  }else{
    temp.push(
      el('h3', 'innerHTML', item._title,
          '@textDecoration', item.isComplete() ? 'line_through' : 'none'),
      el('time', 'innerHTML', item._date.toString(), 'datetime', item._date.toString()),
      el('button', 'innerHTML', item.isComplete() ? 'progress':'complete',
        'addEventListener', ['click', _=>this.toggle(item)]
      ),
      el('button', 'innerHTML', 'remove',
          'addEventListener', ['click',_=>this.remove(parent, item)])
    )
  }
  const sub = el('section',
      'appendChild', el('input', 'type', 'text'),
      'appendChild', el('button', 'innerHTML', 'addTask',
      'addEventListener', ['click', e=>this.add(item, e.target.previousSibliing.value)])
  );
  children.forEach(v=>{this._render(sub, item, v, depth + 1)});
  temp.push(sub);
  temp.forEach(v=>base.appendChild(v));
}

const list1 = new TaskList('s75');
const item1 = new TaskItem('3강교안작성');
list1.add(item1);
const sub1 = new TaskItem('코드정리');
item1.add(sub1);
const subsub1 = new TaskItem('subsub1');
sub1.add(subsub1);

list1.getResult(Task.title);

const todo = new DomRenderer(list1, sel('#todo'));
todo.render();
```
