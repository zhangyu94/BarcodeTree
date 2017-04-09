/**
 * []
 * @param  {[type]} require         [description]
 * @param  {[type]} Mn              [description]
 * @param  {[type]} _               [description]
 * @param  {[type]} $               [description]
 * @param  {[type]} Backbone        [description]
 * @param  {[type]} d3              [description]
 * @param  {[type]} Datacenter      [description]
 * @param  {[type]} Config          [description]
 * @param  {[type]} Variables       [description]
 * @param  {[type]} SVGBase         [description]
 * @param  {[type]} event           [description]
 * @param  {[type]} initialize:     function(options [description]
 * @return {[type]}                 [description]
 */
define([
	'require',
	'marionette',
	'underscore',
	'jquery',
	'backbone',
	'd3',
	'd3Tip',
	'datacenter',
	'config',
	'variables',
	'views/svg-base.addon',
],function(require, Mn, _, $, Backbone, d3, d3Tip, Datacenter, Config, Variables, SVGBase){
	'use strict';
	return Mn.ItemView.extend(_.extend({
		model:undefined,
		tagName: 'svg',
		index: 0,
		template: false, //for the itemview, we must define the template value false
		barcodeSingleLocation:[],
		attributes:{
			style: 'width: 100%; height: 100%;',
			class: 'barcode-single-div'
		},
		/*
		template: function(){
			return _.template(Tpl)
		},
		*/
		events:{

		},
		initialize: function(options){
			var self = this;
			var model = self.model;
		},
		draw_single_barcode: function(){
			var self = this;
			var svg = self.d3el;//此处不能直接用id选svg，因为此时这个svg实际上还没有画出来，只能用self来找
			
			var gPureBarcode = svg.append("g")
						.attr("class","pure-barcode")
						.attr('transform',"translate(" + (Variables.get("indexBoxLeftPadding")+Variables.get("indexBoxWidth")+Variables.get("indexBoxBarcodeDist")) + "," + Variables.get('barcodeupperPadding') + ")");

			//Variables中这些量都是关心的
			//Variables.get('barWidthOfLevel')
	        //'displayedLevel':[],//当前应该被展示的层级的集合
	        //'highlightSibling':false,//标记mouseover时是否highlightsibling
	        //'highlightCousin':false,//标记mouseover时是否highlightcousin
	        //'squarenumOfColumn'

	        var compressBarcodeMode = Variables.get('compressBarcodeMode');//标记当前处在barcode的完全展开或者压缩状态
	        //1.1 当前的barcode的基本数据
			var linearTree = self.model.get("barcodeSingleDataArray");
			var treeIndex = self.model.get("barcodeIndex");
			//1.2 画非压缩状态的barcode需要的位置信息
			var barcodeSingleLocation = self.model.get("barLocationArray");
			if (linearTree.length != barcodeSingleLocation.length)//校验
			{
				console.log("draw uncompressed barcode error")
			}
			//2.1 并集树unionTree的基本数据
			var unionTree = window.Datacenter.barcodeCollection.unionTree;
			//2.2 画压缩状态的barcode需要的位置信息
			var barcodeCollection = window.Datacenter.barcodeCollection;
			var uniontreeReducedSizeXYposition = barcodeCollection.uniontreeReducedSizeXYposition;
			
			draw_pure_barcode(gPureBarcode,self,treeIndex,compressBarcodeMode,linearTree,barcodeSingleLocation,unionTree,barcodeCollection,uniontreeReducedSizeXYposition);
			function draw_pure_barcode(gPureBarcode,self,treeIndex,compressBarcodeMode,linearTree,barcodeSingleLocation,unionTree,barcodeCollection,uniontreeReducedSizeXYposition)
			{
				var drawnDataArray = compressBarcodeMode ? unionTree : linearTree;//真正用于绑定bar的数据
				var locationArray = compressBarcodeMode ? uniontreeReducedSizeXYposition : barcodeSingleLocation;//真正用于决定位置的数组

				var barcodeTip = d3.tip()
				  	.attr('class', 'd3-tip')
				 	.offset([-10, 0])
				  	.html(function(d,i) {
				    	return 	"Name:<span style='color:red'>" + d.name +"</span>" +
				    			"Value:<span style='color:red'>" + d3.format(".3s")(d.trees_values[treeIndex]) + "bytes" +"</span>" +
				    			"Depth:<span style='color:red'>" + d._depth + "</span>" +
				    		 	"Index:<span style='color:red'>" + d.linear_index + "</span>" +
				    		 	"Same pattern number:<span style='color:red'>" + d.maximum_continuous_repeat_group_size + "</span>"
				    		 	;
				  	});
				gPureBarcode.call(barcodeTip);

				gPureBarcode.selectAll('.barcode-rect')
				.data(drawnDataArray)
				.enter()
				.append('rect')
				.attr('class',function(d,i){
					return classHandler(d,treeIndex);
					function classHandler(d,tree_index){
						var virtualDescription = Variables.get('virtualNodeDescription');
						var mode = (d.description != virtualDescription) ? 'existed' : 'nonexisted';
						var fatherIndex = (typeof(d._father) != 'undefined') ? d._father.linear_index : -1;

						return  'linear_index-' + d.linear_index +
								' tree_index-' + tree_index + 
								' fatherIndex-' + fatherIndex +
							    ' _depth-' + d._depth + 
							    ' nth_different_subtree-' + d.nth_different_subtree + 
								' route-' + d.route + 
								' mode-' + mode;
					}
				})
				.attr('id',function(d,i){
					return idHandler(d,treeIndex);
					function idHandler(d,tree_index){
						var id = 'linear_index-' + d.linear_index + "tree_index-" + tree_index;
						return id;
					}
				})
				.attr('x',function(d,i){
					return +locationArray[i].x;
				})
				.attr('y',function(d,i){
					return +locationArray[i].y;
				})
				.attr('height',function(d,i){
					return +locationArray[i].height;
				})
				.attr('width',function(d,i){
					return +locationArray[i].width;
				})
				.attr('fill',function(d,i){
					return fillHandler(d,i,treeIndex);
					function fillHandler(d,i,treeIndex){
						var colorOfLevel = Variables.get("colorOfLevel");
						var removeColor = Variables.get("removeColor");
						var virtualDescription = Variables.get('virtualNodeDescription');
						
						//如果有数值，那一定是在这棵树上存在的现实结点
						if (d.trees_values[treeIndex] != 0)
							return colorOfLevel[+d._depth];
						//如果没有数值，而且description是virtualDescription，说明是这棵树的虚拟结点，对于虚拟结点中可以作为模式结点的点，仍然应该有颜色
						else if (d.description == virtualDescription && d.continuous_repeat_time == 1 && d.maximum_continuous_repeat_group_size != 1)
							return colorOfLevel[+d._depth];
						else
							return removeColor;
					}
				})
				.on('mouseover',function(d,i){
					barcodeTip.show(d,i);
				})
				.on('mouseout',function(d,i){
					barcodeTip.hide(d,i);
				});
			}
		
			draw_index_box(svg,treeIndex);
			/*
			* @function: drawIndex绘制barcode tree 前面的index rect以及index
			* @parameter: null
			*/
			function draw_index_box(svg,treeIndex){
				var rectHeight = Variables.get("barHeight");
				var originIndexX = Variables.get("indexBoxLeftPadding");
				var indexBoxWidth = Variables.get("indexBoxWidth");
				var indexRectBeginY = 0;

				var indexTextX1 = originIndexX + indexBoxWidth / 4;
				var indexTextX2 = originIndexX + indexBoxWidth / 16;
				var indexTextY = indexRectBeginY + rectHeight * 5 / 8;
				svg.select('#group-' + treeIndex).remove();

				var indexGroup = svg.append('g')
					.attr('id','group-' + treeIndex)
					.attr('transform',"translate(0," + Variables.get('barcodeupperPadding') + ")");

				indexGroup.append('rect')
					.attr('class', 'index-rect')
					.attr('x',originIndexX)
					.attr('y', indexRectBeginY)
					.attr('width',indexBoxWidth)
					.attr('height',rectHeight)
					.on('mouseover',function(d,i){
						d3.select(this).classed('this-highlight',true);
					})
					.on('mouseout',function(d,i){
						d3.select(this).classed('this-highlight',false);
					});
				
				var indexText = treeIndex;
				indexGroup.append('text')
						.attr('class', 'index-text')
						.attr('x',function(){
							if (indexText < 10)
								return indexTextX1;
							else
								return indexTextX2;
						})
						.attr('y',indexTextY)
						.text(indexText)
						.style('font-size','15px');
			}
			
			if (compressBarcodeMode == true)
			{
				draw_pattern_bg(gPureBarcode,uniontreeReducedSizeXYposition,treeIndex,unionTree);
			}
			function draw_pattern_bg(gPureBarcode,originNodeArray,index,unionLinearTree){
				var barInterval = Variables.get("barInterval");

				gPureBarcode.selectAll('.barcode-bg-' + index).remove();
				var virtualBeginX = 0, virtualEndX = 0, virtualWidth = 0, virtualHeight = 0, virtualBeginY = 0;
				var isNormal = true;
				var patternId = 0;
				for(var i = 0;i < unionLinearTree.length;i++){
					var treeNode = unionLinearTree[i];
					var treeNodeIndex = treeNode.linear_index;
					var appendNode = null;
					if(treeNode.description == 'virtual' && isNormal)//找background的起点
					{
						virtualBeginX = originNodeArray[i].x - barInterval/2;
						isNormal = false;
					}
					if(treeNode.description != 'virtual' && (!isNormal))//找background的中点
					{
						virtualEndX = originNodeArray[i].x - barInterval/2;
						virtualWidth = virtualEndX - virtualBeginX;
						if(virtualWidth != 0){
							virtualBeginY = -Variables.get("patternbgVerticalPadding");//background_rect_record[index].y - 1;
							virtualHeight = Variables.get("barHeight") + 2*Variables.get("patternbgVerticalPadding");
							appendNode = gPureBarcode.append('rect')
								.attr('class','barcode-bg-' + index)
								.attr('id', 'pattern-' + patternId + 'barcode-bg-' + index)
								.attr('x',virtualBeginX)
								.attr('y',virtualBeginY)
								.attr('width',virtualWidth)
								.attr('height',virtualHeight)
								.attr('fill','#eeeeee');
								patternId = patternId + 1;
						}
						
						isNormal = true;
					}
					if(appendNode != null){
						appendNode.each(function(d){
							gotoBackLayer($(this));

							function gotoBackLayer(dom){
								dom.prependTo(dom.parent())
							}
						});
					}
				}
			}



			


			function mouseover_drawlink(d)
			{
				var thisIndex = d.linear_index;
				var linearTreeEle = linear_tree[thisIndex];
				//分别得到自己节点，上溯根节点的父亲节点
				var thisElement = svg.select('#bar-id' + thisIndex + "rect_background_index-" + cur_tree_index + "-" + svg_id);
				var linkArray = [];
				if(($("#state-change").hasClass("active")) && (linearTreeEle.continuous_repeat_time >= 2)){
					thisIndex = linearTreeEle.pattern_index;
					thisElement = svg.select('#bar-id' + thisIndex + "rect_background_index-" + cur_tree_index + "-" + svg_id);
				}
				linkArray.push(thisElement);
				linkFuncTop(thisIndex, linkArray, linear_tree, svg_id);
				//linkFuncBottom(thisIndex, linkArray, cur_tree_index, linear_tree, svg_id);
				for(var j = 0;j < linkArray.length;j++){
					linkArray[j].classed('dim',false);
					linkArray[j].classed('cousin-highlight',false);
					linkArray[j].classed('sibiling-highlight',false);
					linkArray[j].classed('link-node-highlight',true);
				}
				if($("#state-change").hasClass("active")){
					svg.selectAll('.barcode-bg-' + index + '-' + svg_id).classed('pattern-bg-remove',true);
				}
				d3.select(this_element).classed('link-node-highlight',true);
				d3.select(this_element).classed('dim',false);
				if(($("#state-change").hasClass("active")) && linearTreeEle.pattern_index != 'none' 
						&& linearTreeEle.pattern_index != undefined){
					//将pattern的虚拟节点的所有节点进行高亮
					for(var j = +linearTreeEle.pattern_index;;j++){
						if(linear_tree[j].description != 'virtual'){
							break;
						}
						console.log(svg.select('#bar-id' + j + "rect_background_index-" + cur_tree_index + "-" + svg_id));
						svg.select('#bar-id' + j + "rect_background_index-" + cur_tree_index + "-" + svg_id)
							.classed('dim',false);
						svg.select('#bar-id' + j + "rect_background_index-" + cur_tree_index + "-" + svg_id)
							.classed('link-node-highlight',true);//link-node-highlight
					}
					//将barcode的背景去除
					svg.selectAll('.barcode-bg-' + index + '-' + svg_id).classed('pattern-bg-remove',true);
				}
				draw_link(linkArray, svg_id);
				/*
				* @linkFuncTop: 获取从根节点到某个节点路径上面的节点
				* @parameter: this_index 表示的计算的节点的index值， link_array 表示的是存储的节点的数组
				*/
				function linkFuncTop(this_index, link_array, linear_tree, svg_id){
					var svg = d3.select("#" + svg_id);
					var thisIndex = this_index;
					var linkArray = link_array;
					var thisNode = linear_tree[thisIndex];
					if(thisNode._father != undefined){
						var fatherIndex = thisNode._father.linear_index;
						var fatherElement = svg.select('#bar-id' + fatherIndex + 'rect_background_index-' + cur_tree_index + '-' + svg_id);
						linkArray.push(fatherElement);
						linkFuncTop(fatherIndex, linkArray, linear_tree, svg_id);
					}
					return;
				}
				/*
				* @linkFuncBottom: 获取从某个节点到最低层次的路径上面的节点，对于上面的方法得到的数组进行补充
				* @parameter: this_index 表示要计算的中心节点的index值， link_array 表示的是存储的节点的数组
				*/
				function linkFuncBottom(this_index, link_array, cur_tree_index, linear_tree, svg_id){
					var svg = d3.select("#" + svg_id);
					var thisIndex = this_index;
					var linkArray = link_array;
					var curTreeIndex = cur_tree_index;
					var thisNode = linear_tree[thisIndex];
					var childIndex = 0;
					if(thisNode.children != undefined){
						if($("#state-change").hasClass("active")){
							childIndex = thisNode.children[0].linear_index;
						}else{
							/*if(thisNode.children[0].description == 'virtual'){
								childIndex = thisNode.children[1].linear_index;
							}else{
								childIndex = thisNode.children[0].linear_index;
							}*/
							childIndex = thisNode.min_index_array[curTreeIndex + 1];
						}
						var childElement = svg.select('#bar-id' + childIndex + 'rect_background_index-' + cur_tree_index + '-' + svg_id);
						linkArray.push(childElement);
						linkFuncBottom(childIndex, linkArray, curTreeIndex, linear_tree, svg_id);
					}
				}	

				//element_array可以是数字，里面每个元素都是jquery选中的rect的
				function draw_link(element_array, gPureBarcode)
				{
					var lineLink = '';
					var formerX = 0;
					var lineGroup = gPureBarcode.append('g').attr('class','line');
					for(var i = 0;i < element_array.length;i++){
						var element = element_array[i];
						var thisWidth = +element.attr("width");
						var thisX = +element.attr("x");
						var thisY = +element.attr("y");
						var thisHeight = +element.attr("height");
						var thisCircleX = thisX + thisWidth / 2;
						var thisCircleY = thisY + thisHeight / 2;
						var thisCircleR = thisWidth / 4;
						var disX = thisX - formerX;
						lineGroup.append('circle')
							.attr('class','center-circle')
							.attr('cx',thisCircleX)
							.attr('cy',thisCircleY)
							.attr('r',thisCircleR);
						if(i == 0){
							lineLink = lineLink + 'M' + thisCircleX + ',' + thisCircleY;
						}else{
							lineLink = lineLink + 'L' + thisCircleX + ',' + thisCircleY;
						}
					}
					lineGroup.append("path")
				   	//.datum(d3.range(points))
					.attr("class", 'line-link')
			   		.attr("d", lineLink);
				}
			}

			



			//在树压缩状态下画pattern的排序按钮
			function draw_reduce_button(originButtonNodeArray){
				document.getElementById('sort-button-div').innerHTML = "";
				var buttonContainer = document.getElementById('sort-button-div');
				var buttonHeight = $('#sort-button-div').height() - 3;
				var defaultDepth = 10;
				var beginX = 0;
				var formerEndX = 0;
				var beginNodeDepth = 0;
				var beginNodeMaxTime = 0;
				var endX = 0;
				var buttonWidth = 0;
				var repeatTime = 1;
				buttonRepeatArray = [];
				for(var i = 0;i < unionLinearTree.length;i++){
					var treeNode = unionLinearTree[i];
					var treeNodeIndex = treeNode.linear_index;
					if(treeNode.description == 'virtual' && treeNode.continuous_repeat_time == 1 
							&& treeNode._depth < defaultDepth){
						beginNodeDepth = treeNode._depth;
						beginNodeMaxTime = treeNode.maximum_continuous_repeat_group_size;
						beginX = originButtonNodeArray[treeNodeIndex].x;
						defaultDepth = treeNode._depth;
						buttonRepeatArray[repeatTime] = unionLinearTree[i].trees_values;
					}
					if(treeNode.continuous_repeat_time == beginNodeMaxTime && treeNode._depth == beginNodeDepth){
						endX = originButtonNodeArray[treeNodeIndex].x + originButtonNodeArray[treeNodeIndex].width;
						originButtonWidth = endX - beginX;
						defaultDepth = 10;
						if(originButtonWidth != 0){
							var sortButton = document.createElement('button');
							var marginLeft = (beginX - formerEndX);
							if(marginLeft == 9){
								marginLeft = 8;
							}
							var buttonId = "pattern-" + repeatTime;
							sortButton.className = "btn btn-default btn-xs pattern";
							sortButton.setAttribute("id",buttonId);
							sortButton.style.marginLeft = marginLeft + "px";
							sortButton.style.width = originButtonWidth + "px";
							sortButton.style.height = buttonHeight + "px";
							$(sortButton).attr('title', buttonId);
							sortButton.onclick = function(){
								var thisObject = $(this);
								if(thisObject.hasClass('pattern-active')){
									clickActive(thisObject);
								}else{
									clickNonActive(thisObject);
								}
							};
							$(sortButton).hover(function(){
								//patternTip.show(sortButton);
							},function(){
								//patternTip.hide(sortButton);
							})
							if(originButtonWidth < 15){
								sortButton.innerHTML = '';
							}else if(originButtonWidth < 30){
								sortButton.innerHTML = '.';
							}else if(originButtonWidth < 80){
								sortButton.innerHTML = repeatTime;
							}else{
								sortButton.innerHTML = "pattern " + repeatTime;
							}
							buttonContainer.appendChild(sortButton);
							if(unionLinearTree[treeNodeIndex].children != undefined){
								var childrenLength = unionLinearTree[treeNodeIndex].children.length;
								i = unionLinearTree[treeNodeIndex].children[childrenLength - 1].linear_index;
							}
							formerEndX = beginX + originButtonWidth;
							repeatTime = repeatTime + 1;
						}
					}
				}
			}

			//在树不压缩状态下画pattern的排序按钮
			function draw_button(originButtonNodeArray,unionLinearTree)
			{
				document.getElementById('sort-button-div').innerHTML = "";
				var buttonContainer = document.getElementById('sort-button-div');
				var buttonHeight = $('#sort-button-div').height() - 3;
				var defaultDepth = 10;
				var beginX = 0;
				var formerEndX = 0;
				var beginNodeDepth = 0;
				var beginNodeMaxTime = 0;
				var endX = 0;
				var buttonWidth = 0;
				var repeatTime = 1;
				var buttonRepeatArray = [];
				for(var i = 0;i < unionLinearTree.length;i++){
					var treeNode = unionLinearTree[i];
					var treeNodeIndex = treeNode.linear_index;
					if(treeNode.description == 'virtual' && treeNode.continuous_repeat_time == 1 
							&& treeNode._depth < defaultDepth){
						beginNodeDepth = treeNode._depth;
						beginNodeMaxTime = treeNode.maximum_continuous_repeat_group_size;
						beginX = originButtonNodeArray[treeNodeIndex].x;
						defaultDepth = treeNode._depth;
						buttonRepeatArray[repeatTime] = unionLinearTree[i].trees_values;
					}
					if(treeNode.continuous_repeat_time == beginNodeMaxTime && treeNode._depth == beginNodeDepth){
						endX = originButtonNodeArray[treeNodeIndex].x;
						var originButtonWidth = (endX - beginX) / (beginNodeMaxTime - 2) * (beginNodeMaxTime - 1);
						if(originButtonWidth != 0){
								defaultDepth = 10;
								var sortButton = document.createElement('button');
								var buttonId = "pattern-" + repeatTime;
								sortButton.setAttribute("id",buttonId);
								sortButton.style.marginLeft = (beginX - formerEndX) + "px";
								sortButton.className = "btn btn-default btn-xs pattern";
								sortButton.style.width = originButtonWidth + "px";
								sortButton.style.height = buttonHeight + "px";
								$(sortButton).attr('title', buttonId);
							sortButton.onclick = function(){
								var thisObject = $(this);
								if(thisObject.hasClass('pattern-active')){
									clickActive(thisObject);
								}else{
									clickNonActive(thisObject);
								}
							};
							$(sortButton).hover(function(){
								//patternTip.show(sortButton);
							},function(){
								//patternTip.hide(sortButton);
							});
							if(originButtonWidth < 15){
								sortButton.innerHTML = '';
							}else if(originButtonWidth < 30){
								sortButton.innerHTML = '.';
							}else if(originButtonWidth < 80){
								sortButton.innerHTML = repeatTime;
							}else{
								sortButton.innerHTML = "pattern " + repeatTime;
							}
							buttonContainer.appendChild(sortButton);
							if(unionLinearTree[treeNodeIndex].children != undefined){
								var childrenLength = unionLinearTree[treeNodeIndex].children.length;
								i = unionLinearTree[treeNodeIndex].children[childrenLength - 1].linear_index;
							}
							formerEndX = beginX + originButtonWidth;
							repeatTime = repeatTime + 1;
						}
					}
				}
			}

			function clickActive(this_object){
				$(".pattern").removeClass("pattern-active");
				this_object.removeClass("pattern-active")
				var thisID = $(this).attr('id');
				if(thisID == undefined){
					return;
				}
				var patternIdArray = $(this).attr('id').split('-');
				var patternId = patternIdArray[1];
				for(var i = 0; i < dataList.length; i++){
					var Length = dataList.length - 1;
					//warning: draw_barcode(i, radialSvgName, [i], NOTJUDGEAND, NOTJUDGEOR, Length - i, ISRESORT);
				}
			}
			function clickNonActive(this_object){
				$(".pattern").removeClass("pattern-active");
				this_object.addClass("pattern-active");
				var patternIdArray = this_object.attr('id').split('-');
				var patternId = +patternIdArray[1];
				var oneRepeatArray = buttonRepeatArray[patternId];
				var processRepeatArray = [];
				for(var i = 1; i < oneRepeatArray.length; i++){
					processRepeatArray[i - 1] = new Object();
					processRepeatArray[i - 1].index = i - 1;
					processRepeatArray[i - 1].number = oneRepeatArray[i];
				}
				processRepeatArray.sort(function(a,b){
					var numA = a.number;
					var numB = b.number;
					return numA < numB;
				})
				for(var i = 0; i < dataList.length; i++){
					var Length = dataList.length - 1;
					//warning: draw_barcode(i, radialSvgName, [i], NOTJUDGEAND, NOTJUDGEOR, processRepeatArray[i].index, ISRESORT);
				}
			}



			
			/*
			* @function: fillHandler判断bar的颜色的函数(对于reduce模式与origin模式是相同的)
			* @parameter: d,i,cur_tree_index d3原始的参数以及当前绘制的树的index值
			*/
			function fillHandler(d,i,cur_tree_index,this_element){
				var depth = +d._depth;
				if(judgeAnd){
					// 对于虚拟节点
					if(d.description == 'virtual'){
						var sendArray = [];
						for(var j = 0;j < idArray.length;j++){
							sendArray.push(d.trees_values_array[idArray[j] + 1]);
						}
						if(hasAndValue(sendArray)){
							return LEVEL_ARRAY[depth];
						}
						d3.select(this_element).classed('removenode',true);
						return removeColor;
					}
					// 对于实际存在的节点
					for(var j = 0;j < idArray.length;j++){
						if(d.trees_values[idArray[j] + 1] == 'none'){
							d3.select(this_element).classed('removenode',true);
							return removeColor;
						}
					}
					return LEVEL_ARRAY[depth];
				}else if(judgeOr){
					// 对于虚拟节点
					if(d.description == 'virtual'){
						var sendArray = [];
						for(var j = 0;j < idArray.length;j++){
							sendArray.push(d.trees_values_array[idArray[j] + 1]);
						}
						if(hasOrValue(sendArray)){
							return LEVEL_ARRAY[depth];
						}
						d3.select(this_element).classed('removenode',true);
						return removeColor;
					}
					// 对于实际存在的节点
					for(var j = 0;j < idArray.length;j++){
						if(d.trees_values[idArray[j] + 1] != 'none'){
							return LEVEL_ARRAY[depth];
						}
					}
					d3.select(this_element).classed('removenode',true);
					return removeColor;
				}else{
					if(d.description == 'virtual' && d.trees_values[cur_tree_index + 1] != 0){
						return LEVEL_ARRAY[depth];
					}else if(d.description == 'virtual' && d.trees_values[cur_tree_index + 1] == 0){
						d3.select(this_element).classed('removenode',true);
						return removeColor;
					}
					if(d.trees_values[cur_tree_index + 1] == 'none'){
						d3.select(this_element).classed('removenode',true);
						return removeColor;
					}else{
						return LEVEL_ARRAY[depth];;
					}
				}
			}
			/*
			* @function: mouseoverhandler 鼠标hover的响应事件(origin模式)
			* @parameter: d,i d3原始的参数 
			*	cur_tree_index是树在当前的图中的编号，而不是在histogram中的编号
			*/
			function mouseoverHandler(d,i,svg_id,cur_tree_index,this_element){
				var svg = d3.select("#" + svg_id);
				var curTreeIndex = cur_tree_index;
				//与histogram的linking
				if(d3.select(this_element).classed(radialSvgName)){
					var treeId = dataList[barcoded_tree_rectbackground_index].id;
					var cur_tree_sumvalue = linear_tree[0].trees_values[cur_tree_index+1];
					var cur_node_value = d.trees_values[cur_tree_index+1];
					//发出当前的树节点的流量占当前的树的总流量的比例
					ObserverManager.post("percentage",[cur_node_value/cur_tree_sumvalue, d._depth, treeId]);
				}
				//显示节点的tooltip
				radialTip.show(d);
				//高亮同层节点
				if(document.getElementById('highlight_cousin').checked){
					var cousinNode = svg.selectAll('.num-' + d._depth + '-' + cur_tree_index)[0];
					for(var j = 0;j < cousinNode.length;j++){
						var thisNode = d3.select(cousinNode[j]);
						if(thisNode.attr('fill') != removeColor && !thisNode.classed('nonexisted')){
							thisNode.classed('cousin-highlight', true);
						}
					}
				}
				//高亮具有相同父亲的节点
				if(document.getElementById('highlight_sibling').checked){
				   	if(d._father!=undefined){
						var siblingNode = svg.selectAll(".father-" + d._father.linear_index +
									  "rect_background_index-" + cur_tree_index)[0];
						for(var j = 0;j < siblingNode.length;j++){
							var thisNode = d3.select(siblingNode[j]);
							if(thisNode.attr('fill') != removeColor  && !thisNode.classed('nonexisted')){
								thisNode.classed('cousin-highlight',false);
								thisNode.classed("sibiling-highlight",true);
							}
						}
					}
				}			
				var thisIndex = d.linear_index;
				var linearTreeEle = linear_tree[thisIndex];
				svg.selectAll('.bar-class-' + cur_tree_index).classed('dim',true);
				//分别得到自己节点，上溯根节点的父亲节点
				var thisElement = svg.select('#bar-id' + thisIndex + "rect_background_index-" + cur_tree_index + "-" + svg_id);
				thisElement.classed('sibiling-highlight',false);
				thisElement.classed('cousin-highlight',false);
				var linkArray = [];
				if(($("#state-change").hasClass("active")) && (linearTreeEle.continuous_repeat_time >= 2)){
					thisIndex = linearTreeEle.pattern_index;
					thisElement = svg.select('#bar-id' + thisIndex + "rect_background_index-" + cur_tree_index + "-" + svg_id);
				}
				linkArray.push(thisElement);
				linkFuncTop(thisIndex, linkArray, linear_tree, svg_id);
				//linkFuncBottom(thisIndex, linkArray, cur_tree_index, linear_tree, svg_id);
				for(var j = 0;j < linkArray.length;j++){
					linkArray[j].classed('dim',false);
					linkArray[j].classed('cousin-highlight',false);
					linkArray[j].classed('sibiling-highlight',false);
					linkArray[j].classed('link-node-highlight',true);
				}
				if($("#state-change").hasClass("active")){
					svg.selectAll('.barcode-bg-' + index + '-' + svg_id).classed('pattern-bg-remove',true);
				}
				d3.select(this_element).classed('link-node-highlight',true);
				d3.select(this_element).classed('dim',false);
				if(($("#state-change").hasClass("active")) && linearTreeEle.pattern_index != 'none' 
						&& linearTreeEle.pattern_index != undefined){
					//将pattern的虚拟节点的所有节点进行高亮
					for(var j = +linearTreeEle.pattern_index;;j++){
						if(linear_tree[j].description != 'virtual'){
							break;
						}
						console.log(svg.select('#bar-id' + j + "rect_background_index-" + cur_tree_index + "-" + svg_id));
						svg.select('#bar-id' + j + "rect_background_index-" + cur_tree_index + "-" + svg_id)
							.classed('dim',false);
						svg.select('#bar-id' + j + "rect_background_index-" + cur_tree_index + "-" + svg_id)
							.classed('link-node-highlight',true);//link-node-highlight
					}
					//将barcode的背景去除
					svg.selectAll('.barcode-bg-' + index + '-' + svg_id).classed('pattern-bg-remove',true);
				}
				draw_link(linkArray, svg_id);
				/*
				* @linkFuncTop: 获取从根节点到某个节点路径上面的节点
				* @parameter: this_index 表示的计算的节点的index值， link_array 表示的是存储的节点的数组
				*/
				function linkFuncTop(this_index, link_array, linear_tree, svg_id){
					var svg = d3.select("#" + svg_id);
					var thisIndex = this_index;
					var linkArray = link_array;
					var thisNode = linear_tree[thisIndex];
					if(thisNode._father != undefined){
						var fatherIndex = thisNode._father.linear_index;
						var fatherElement = svg.select('#bar-id' + fatherIndex + 'rect_background_index-' + cur_tree_index + '-' + svg_id);
						linkArray.push(fatherElement);
						linkFuncTop(fatherIndex, linkArray, linear_tree, svg_id);
					}
					return;
				}
			}
			/*
			* @function: mouseoutHandler 鼠标hover离开的响应事件(origin模式)
			* @parameter: d,i d3原始的参数
			*/
			function mouseoutHandler(d,i,svg_id,cur_tree_index){
				radialTip.hide(d);
				d3.selectAll('.bar-class-' + cur_tree_index).classed('dim',false);
				d3.selectAll('.line').remove();
				var thisIndex = d.linear_index;

				d3.selectAll('.bar-class')
				.classed("sibiling-highlight",false);

				d3.selectAll('.bar-class')
				.classed('link-node-highlight',false);

				d3.selectAll('.bar-class')
				.classed('hight-light-pattern',false);
				
				d3.selectAll('.bar-class')
				.classed("cousin-highlight",false);

				d3.selectAll('.barcode-bg')
				.classed("pattern-bg-remove",false);
			}

		},
		

		/*
		draw_grid: function(svg_id,biasx,biasy,width,height,repeattime)//repeattime决定网格的密度
		{
			var line_num=0;
			if (repeattime<=5)
			{
				console.log("draw_grid error");
			}
			else
			{
				if (reapttime<=20)
					line_num=3;
				else if (repeattime<=40)
					line_num=5;
				else
					line_num=7;
			}
				
			svg = d3.select('#'+svg_id);
			var group=svg.append("g")
						.attr("transform",function(d,i){  
								return "translate(" + (biasx) + "," + (biasy + rectY) + ")";  
							})
						.on("mouseover",function(d,i){
							d3.selectAll('.grid')
								.attr('fill','lightblue');
						})
						.on("click",function(d,i){
						
						})
						.on("mouseout",function(){
							d3.selectAll('.grid')
								.attr('fill','white');
						})
			//外边框
			var cur_button_shape=	"M" + (0) + "," + 0 +
									"L" + (0) + ","+ width + 
									"L" + (height) + ","+ width + 
									"L" + (height) + ","+ 0;
			group.append("path")	
					.attr('class', 'grid')							 		
					.attr("d",cur_button_shape)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1)
					.attr("fill",function(d,i){  						
						return "white";  					
					})
			//左上到右下
			for (var i=1;i<line_num;++i)
			{		
				var cur_button_shape=	"M" + (sawToothW-sawToothWidth) + "," + rectHeight * 0.4 +
									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.4 + 
									"L" + (sawToothW-sawToothWidth) + "," + rectHeight * 0.2 +
									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.2 +
									"L" + (sawToothW-sawToothWidth) + ","+ 0 +
									"L" + (0-sawToothWidth) + ","+ 0 +
									"L" + (0-sawToothWidth) + ","+ rectHeight +
									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight +
									"L" + (sawToothW-sawToothWidth) + ","+ rectHeight * 0.8 +
									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.8 +
									"L" + (sawToothW-sawToothWidth) + ","+ rectHeight * 0.6 +
									"L" + (sawToothW * 0.8-sawToothWidth) + ","+ rectHeight * 0.6
		
				group.append("path")	
					.attr('class', 'grid')							 		
					.attr("d",cur_button_shape)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1)
					.attr("fill",function(d,i){  						
						return "white";  					
					})
					
			}
			//右上到左下
			for (var i=1;i<line_num;++i)
			{				
				group.append("path")	
					.attr('class', 'grid')							 		
					.attr("d",cur_button_shape)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1)
					.attr("fill",function(d,i){  						
						return "white";  					
					})
					
			}			
		}
		*/




	}, SVGBase));
});