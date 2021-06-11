// const a = {
//   [Symbol.iterator](){ return this; },
//   data: [{a:7, b:'-', c:[1,2,3]}, [5,6,7], 8, 9],
//   next() {
//     let v;
//     while(v = this.data.shift()) {
//       switch(true) { 
//         case Array.isArray(v):
//           this.data.unshift(...v);
//           break;
//         case v && typeof v == 'object':
//           const tmp = [];
//           for(var k in v) { 
//             if(v.hasOwnProperty(k)){
//               console.log(v[k]);
//               tmp.unshift(v[k]);
//             }
//           }
//           this.data.unshift(...tmp.reverse());
//           console.log(this.data);
//           break;
//         default:
//           return {value: v, done: false}; 
//       }
//     }
//     return {done: true};
//   }
// };

// const b = {
//   [Symbol.iterator]() { return this; },
//   data: [{a:[1,2,3,4], b:'-'}, [5,6,7], 8, 9, null], //null은 처리가 안된다.. 이걸 잡기 위해선 단위테스트를 작성해야된다.
//   next() {
//     let v;
//     while(v = this.data.shift()) {
//       if(!(v instanceof Object)) return {value: v};
//       if(!Array.isArray(v)) v = Object.values(v); //이것은 알아서 hasOwnProperty를 가져온다. 위의 것은 아닌 것도 가져올 수 있다.
//       this.data.unshift(...v);
//     }
//     return {done: true};
//   }
// }

// const Compx = class{}


// // console.log([...a]);

// const Operator = class {
//   static factory(v) {
//     if(v instanceof Object) {
//       if(!Array.isArray(v)) v = Object.values(v);
//       return new ArrayOp(v.map(v=>Operator.factory(v)));
//     }else return typeof v ==='string' ? new StringOp(v) : new PrimaOp(v);
//   }
//   constructor(v){this.v = v;}
//   *gene(f){throw 'override';}
// };

// const StringOp = class extends Operator {
//   constructor(v) { super(v);}
//   *gene(f){for(const a of this.v) yield a;}
// }

// const PrimaOp = class extends Operator {
//   constructor(v) { super(v);}
//   *gene(f){yield this.v;}
// };

// const ArrayOp = class extends Operator {
//   constructor(v) { super(v);}
//   *gene(f){for(const v of this.v) yield * v.gene();} //yield * generator는 generator의 yield 모두 처리한 이후 넘어가도록 하는것임. 위임 일드라고함.
// };

// for(const v of Operator.factory([1,2,3,{a:'123', b:5}, 6, 7]).gene()) console.log(v);

// const odd = function*(data) {
//   for(const v of data) {
//     console.log("odd", odd.cnt++);
//     if(v % 2) yield v;
//   }
// };

// odd.cnt = 0;
// // for(const v of odd([1,2,3,4])) console.log(v);

// const take = function*(data, n) {
//   for(const v of data) {
//     console.log("take", take.cnt++);
//     if(n--) yield v; else break;
//   }
// };
// take.cnt = 0;
// for(const v of take([1,2,3,4], 2)) console.log(v);

// for(const v of take(odd([1,2,3,4]), 2)) console.log(v);

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

const odd = function*(data) {
  for(const v of data) if (v%2) yield v;
};
const take = function*(data, n) {
  for(const v of data) if(n--) yield v; else break;
};
for(const v of Stream.get([1,2,3,4]).add(odd).add(take,2).gene())
console.log(v);