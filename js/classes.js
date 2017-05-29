
class Art{
	constructor(pmid,date,title){
		this.pmid = pmid;
		this.title = title;
		if(date==null){
			this.date = "Unknown";
		}else{
			this.date = date.toString();
			this.year = parseInt(this.date.substring(0,4));
			this.month = parseInt(this.date.substring(4,6));
			this.day = parseInt(this.date.substring(6,8));
		}
	}
}

class Term {
	constructor(name,type,stype){
		this.name = name;
		this.type = type;
		this.stype = stype;
		this.count = 0;
		var left = null;
		var right = null; 
		this.stack = [];
		this.isDrug = false;
		
		var isSelected = false;
		var isSynonym = false;
		var mainTerm = null;
		
		this.sharedCount1 = 0;
		this.stack1 = [];
		this.stack2 = [];
		var sharedStack = null;
		this.sharedCount2 = 0;
		this.sharedCountBoth = 0;
	}
	copy(){
		var copy = new Term(this.name,this.type,this.stype);
		copy.count = this.count;
		copy.isDrug = this.isDrug;
		copy.stack = this.stack.slice();
		copy.sharedCount1 = this.sharedCount1;
		copy.stack1 = this.stack1;
		copy.stack2 = this.stack2;
		copy.sharedCount2 = this.sharedCount2;
		return copy;
	}
	sharedCopy(){
		var copy = this.copy();
		copy.sharedCount1 = this.count;
		copy.count = 0;
		copy.sharedStack = new NumStack();
		for(var i=0;i<this.stack.length;i++){
			copy.sharedStack.add(this.stack[i].pmid,this.stack[i]);
		}
		copy.stack1 = this.stack;
		copy.stack = [];
		return copy;
	}
	
	checkPosition(stack){
		var ccc = 0;
		while(true){
			ccc++;
			if(this.left==null){
				stack.first = this;
				return;
			}
			if(ccc>stack.length+1){ //problem
				return;
			}
			
			if(this.left.count<this.count){
				if(this.right==null){
					stack.end = this.left;
					this.left.right = null;
					this.right = this.left;
					this.left = this.left.left;
					this.right.left = this;
					if(this.left!=null){
						this.left.right = this;
					}
				}else{
					this.right.left = this.left;
					this.left.right = this.right;
					this.right = this.left;
					this.left = this.left.left;
					this.right.left = this;
					if(this.left!=null){
						this.left.right = this;
					}
				}
			}else{	
				return;
			}
		}
	}
	
	addArt(pmid,date,stack,title){
		this.count++;
		var art = new Art(pmid,date,title);
		this.stack.push(art);
		this.checkPosition(stack);
	}
	
	addArtShared(pmid,date,stack,title){
		this.sharedCount2++;
		var art = new Art(pmid,date,title);
		this.stack2.push(art)
		if(this.sharedStack.get(pmid)!=false){
			this.stack.push(art);
			this.count++;
			this.checkPosition(stack);
		}
	}
}
	
class NumStack {
	constructor(){
		this.stack = [];
		this.thornstack = [];
	}
	add(tag,object){
		var chars = tag.toString().split('');
		var array = this.thornstack;
		for(var i=0;i<chars.length;i++){
			if (array.length==0){
				for(var j=0;j<11;j++){
					array.push([]);
				}
			}
			var pos = this.chartonum(chars[i]);
			array = array[pos];
		}		
		array[0] = object;
		this.stack.push(object);
	}
	
	get(tag){
		var chars = tag.toString().split('');
		var array = this.thornstack;
		for(var i=0;i<chars.length;i++){
			if(array.length==0){
				return false;
			}
			var pos = this.chartonum(chars[i]);
			array = array[pos];
		}
		if(array[0]==[]){
			return false;
		}else{
			return array[0];
		}
	}
	
	chartonum(cha){
		if (cha == '0'){ return 1; }
		if (cha == '1'){ return 2; }
		if (cha == '2'){ return 3; }
		if (cha == '3'){ return 4; }
		if (cha == '4'){ return 5; }
		if (cha == '5'){ return 6; }
		if (cha == '6'){ return 7; }
		if (cha == '7'){ return 8; }
		if (cha == '8'){ return 9; }
		if (cha == '9'){ return 10; }
		else{ return 11; }
	}
	
}


class ThornStack {
	constructor(withCountCode=true){
		this.first = null;
		this.end = null;
		this.thornstack = [];
		this.list = [];
		this.length = 0;
		this.extra = true;
		this.withCountCode = withCountCode;
	}
	
	add(tag,object){
		var chars = tag.toString().split('');
		var length = chars.length;
		var array = this.thornstack;
		
		for(var i=0;i<length;i++){
			var arrayMissing = true;
			var pos = this.chartonum(chars[i]);
			for(var j=0;j<array.length;j++){
				if(array[j][0]==pos){
					array = array[j][1];
					arrayMissing = false;
					break;
				}else if(array[j][0]>pos){
					var newArray = [];
					array.splice(j,0,[pos,newArray]);
					array = newArray;
					arrayMissing = false;
					break;
				}
			}
			if(arrayMissing){
				var newArray = [];
				array.push([pos,newArray]);
				array = newArray;
			}	
		}	
		array.splice(0,0,[0,object]);
		this.length++;
		//EXTRA STUFF
		if(this.withCountCode){
			if(this.extra){
				if(this.first==null){						
					this.first = object;
					this.end = object;	
				}else{
					this.end.right = object;
					object.left = this.end;
					this.end = object;
				}
				object.checkPosition(this); 
			}
		}else{
			this.list.push(tag);
		}
	}
	
	get(tag){
		var chars = tag.split('');
		var array = this.thornstack;
		
		for(var i=0;i<chars.length;i++){		
			if(array.length==0){
				return false;
			}
			var isMissing = true;
			var pos = this.chartonum(chars[i]);
			for(var j=0;j<array.length;j++){
				if(array[j][0]==pos){
					array = array[j][1];
					isMissing = false;
					break;
				}else if(array[j][0]>pos){
					return false;
				}
			}
			if(isMissing){
				return false;
			}
		}
		
		if(array[0][0]==0){
			return array[0][1];
		}else{
			return false;
		}
	}

	/* Used to return top 5 results for autocompletion */
	search(tag){
		var chars = tag.split('');
		var array = this.thornstack;
		
		for(var i=0;i<chars.length;i++){
			if(array.length==0){
				return false;
			}
			
			var pos = this.chartonum(chars[i]);
						
			for(var j=0;j<array.length;j++){
				if(array[j][0]==pos){
					array = array[j][1];
					break;
				}else if(array[j][0]>pos){
					return false;
				}
			}
		}
		
		return this.searchFind(array,[]);
	}
	
	searchFind(array,check){
		if(check.length==5){
			return check;
		}
		for(var i=0;i<array.length;i++){
			if(array[0][0]==0){
				var notIn = false;
				for(var j=0;j<check.length;j++){
					if(check[j]==array[0][1]){
						notIn = true;
					}
				}
				if(!notIn){
					check.push(array[0][1]);
				}
				if(check.length==5){
					return check;
				}
			}else{
				this.searchFind(array[i][1],check);
			}
		}
		return check;
	}
	
	/* Used only to compare the order of characters. Unnecessary */
	chartonum(cha){
		var upper = cha.toUpperCase();
		var code = upper.charCodeAt(0);
		
		// is a letter
		if (code >= 65 && code <= 90){
			return code-64;	//1 - 26
		}
		
		//is a number
		if (code >= 48 && code <= 57){
			return code-21;	//27 - 36
		}
		
		if (cha == ','){ return 37; }
		if (cha == ';'){ return 38; }
		if (cha == '-'){ return 39; }
		if (cha == ' '){ return 40; }

		return 41; 
	}
}


