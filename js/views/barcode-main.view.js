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
	//'collections/barcode.collection',
	'views/svg-base.addon',
	'views/barcode-single.view',
	'text!templates/barcodeMainView.tpl'
],function(require, Mn, _, $, Backbone, d3, d3Tip, Datacenter, Config, Variables, /*BarcodeCollection,*/ SVGBase, BarcodeSingle, Tpl){
	'use strict';
	return Mn.LayoutView.extend({
		tagName: 'div',
		template: false, //for the itemview, we must define the template value false
		attributes:{
			style: 'width: 100%; height: 100%;',
			id: 'barcode-main-div'
		},
		
		regions:{
			barcode0: "#selected-barcode-0"
		},
		
		template: function(){
			return _.template(Tpl)
		},
		events:{

		},
		initialize: function(options){
			var self = this;
			self.d3el = d3.select(self.el);

			var model = self.model;
			var barcodeCollection = window.Datacenter.barcodeCollection;
			
			//1. 监听当前选中的bar的集合的变化，认为正常情况下，触发前后集合只会有一个元素的变化
			self.listenTo(Variables,'change:selectBarArray',function(model,value){
				var preSelectBarArray = model.previous("selectBarArray");
				var curSelectBarArray = value;
				function _arrayDiff(array1,array2)//array1-array2得到的差
				{
					var array3 = [];
					for(var i = 0; i < array1.length; i++){   
				        var flag = true;   
				        for(var j = 0; j < array2.length; j++){   
				            if(array1[i] == array2[j])   
				            flag = false;   
				        }   
				        if(flag)   
				        	array3.push(array1[i]);   
				    }
				    if (array3.length != 1)
				    {
				    	console.log("add barcode error, adding more than one barcode at one time");
				    }
				    return array3[0];
				}

				var preBarNum = preSelectBarArray.length;
				var curBarNum = curSelectBarArray.length;

				var viewTotalHeight = $(self.$el).height();
				var subViewHeight = viewTotalHeight / curBarNum;//所有空间平均分配

				if (curBarNum >= preBarNum + 2){
					console.log("add barcode error, adding more than one barcode at one time");
				}
				else if (curBarNum == preBarNum + 1)//添加了一个barcode
				{
					var addedBarIndex = _arrayDiff(curSelectBarArray,preSelectBarArray)//curSelectBarArray-preSelectBarArray
					
					//1.开新的可拖拽的div
					d3.selectAll("#barcode-main-div #sortable-barcode-list")
						.append("div")
						.attr("class","single-barcode")
						.attr("id","selected-barcode-" + addedBarIndex);

					//2.添加新region
					self.regions["barcode" + addedBarIndex] = "#selected-barcode-" + addedBarIndex;
					self.addRegion("barcode" + addedBarIndex,"#selected-barcode-" + addedBarIndex);
					
					//3.在新region上开新的子view
					var barcodeSingleModel = barcodeCollection.models[addedBarIndex];
					var barcodeSingleView = new BarcodeSingle({index:addedBarIndex,model:barcodeSingleModel});//{barcodeSingleLocation:singleBarcodeLocation, index: 0}
					self.showChildView("barcode" + addedBarIndex, barcodeSingleView);
					barcodeSingleView.draw_single_barcode();
				}
				else if (curBarNum <= preBarNum - 2){
					console.log("decrease barcode error, unselecting more than one barcode at one time");
				}
				else if (curBarNum == preBarNum - 1)//删除了一个barcode
				{
					var deletedBarIndex = _arrayDiff(preSelectBarArray,curSelectBarArray);//preSelectBarArray-curSelectBarArray
					
					//1.移除被删除的barcode所在的可拖拽的div
					d3.selectAll("#barcode-main-div #sortable-barcode-list #selected-barcode-" + deletedBarIndex)
						.remove();

					//2.移除被删除的region，同时移除被删除的子view
					self.removeRegion("barcode" + deletedBarIndex);
				}
				$( "#barcode-main-div .single-barcode" ).css("height",subViewHeight);//增加或删除完barcode后需要调整剩下的barcode的高度

			})

		},
		//注意：函数的名字不能随便起成render，这边如果把draw_barcode名字换成render，那么region中的#selected-barcode-1就不会渲染上来了
		init_draw_barcode: function(){//初始渲染时，利用collection中的信息画出第一个barcode
			$(function() {//让sortable-barcode-list里面的每个barcode可以拖动
			    $( "#barcode-main-div #sortable-barcode-list" ).sortable();
			    $( "#barcode-main-div #sortable-barcode-list" ).disableSelection();
			    $('#barcode-main-div #sortable-barcode-list .ui-sortable').sortable('option', 'containment', 'window')//避免barcode能够被到处乱拉
			    $( "#barcode-main-div .single-barcode" ).css("height",30)
			});

			var self = this;
			var svg = self.d3el;//此处不能直接用id选svg，因为此时这个svg实际上还没有画出来，只能用self来找
			
			var barcodeCollection = window.Datacenter.barcodeCollection;//所有的bar的model的collection
			var selectBarArray = Variables.get('selectBarArray');//存储了需要画的barcode的标号
			
			var barcodeSingleModel = barcodeCollection.models[0];
			var barcodeSingleView = new BarcodeSingle({index:0,model:barcodeSingleModel});
			self.showChildView('barcode0', barcodeSingleView);
			barcodeSingleView.draw_single_barcode();
		},

	});
});