/**
 Observer是将输入的Plain Object进行处理,
 利用Object.defineProperty转化为getter与setter,从而在赋值与取值时进行拦截
 这是Vue响应式框架的基础
 */
function isObject(obj){
    return obj != null && typeof(obj) == 'object';
}
function isPlainObject(obj){
    return Object.prototype.toString(obj) == '[object Object]';
}

function observer(data){
    if(!isObject(data) || !isPlainObject(data)){
        return;
    }
    return new Observer(data);
}

var Observer = function(data){
    this.data = data;
    this.transform(data);
};

Observer.prototype.transform = function(data){
    for(var key in data){
        this.defineReactive(data,key,data[key]);
    }
};

Observer.prototype.defineReactive = function(data,key,value){
    var dep = new Dep();
    /*
        Object.defineProperty
        三个必填参数 目标对象、需要定义的属性或方法的名字、目标属性所拥有的特性

        第三个参数有以下取值：
            value:属性的值
            writable:默认false，如果为false，属性的值就不能被重新赋值,只能为只读了
            configurable:默认false，总开关，一旦为false，就不能再设置他的（value，writable，configurable）
            enumerable:默认false，是否能在for...in循环中遍历出来或在Object.keys中列举出来
            get
            set         
    */
    Object.defineProperty(data,key,{
        enumerable:true,
        configurable:false,
        get:function(){
            if(Dep.target){
                //JS的浏览器单线程特性，保证这个全局变量在同一时间内，只会有同一个监听器使用
                dep.addSub(Dep.target);
            }
            console.log("intercept get:"+key,value);
            return value;
        },
        set:function(newVal){
            console.log("intercept set:"+key,newVal);
            if(newVal == value){
                return;
            }
            //利用闭包的特性,修改value,get取值时也会变化
            //不能使用data[key]=newVal
            //因为在set中继续调用set赋值，引起递归调用
            value = newVal;
            //监视新值
            observer(newVal);
            dep.notify(newVal);
        }
    });

    //递归处理
    observer(value);
};

var Dep = function(){
    this.subs = {};
};
Dep.prototype.addSub = function(target){
    if(!this.subs[target.uid]) {
        //防止重复添加
        this.subs[target.uid] = target;
    }
};
Dep.prototype.notify = function(newVal){
    for(var uid in this.subs){
        this.subs[uid].update(newVal);
    }
};
Dep.target = null;