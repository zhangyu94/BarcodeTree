function draw_slide_bar(){
				function changePercentage(text){
					text = +text;
					var format_text = parseFloat(Math.round(text * 100) / 100).toFixed(2);
					d3.select("#now-value")
						.html(format_text);
				}
				function clearPercentage(){
					d3.select("#now-value")
						.html(null);
				}
				var min = 0;
				var max = 30;
				var sliderHeight = sliderDivHeight;
				var sliderWidth = sliderDivWidth * 2 / 10;
				sliderSvg.append("g")
					.attr("id","slider-g")
					.attr("transform","translate(" + sliderDivWidth * 4 / 10 + "," + 0 + ")");
				var sliderHandleHeight = sliderHeight/30;
				var dragDis = 0;
				var drag = d3.behavior.drag()
			        .on("drag", function(d,i) {
			        	var oy = originArray[i] / max * sliderHeight;
			            var dx = +d3.event.x;
			            var dy = +d3.event.y - oy;
			            if((d3.event.y > 0)&&(d3.event.y < sliderHeight - sliderHandleHeight)){
			            	d3.select(this).attr("transform", function(d,i){
				                return "translate(" + 0 + "," + dy + ")";
				            });
			            }
			            dragDis = dy;
			            var value = dragDis / sliderDivHeight * max;
			        	var finalValue = originArray[i] + value;
			        	finalValue = finalValue > max ? max : finalValue;
			        	finalValue = finalValue < min ? min : finalValue;
			        	changePercentage(finalValue);
			        })
			        .on("dragend",function(d,i){
			        	var value = dragDis / sliderDivHeight * max;
			        	var finalValue = originArray[i] + value;
			        	finalValue = finalValue > max ? max : finalValue;
			        	finalValue = finalValue < min ? min : finalValue;
			        	widthArray[i] = finalValue;
			        	if($("#state-change").hasClass("active")){
							draw_reduced_barcoded_tree(linear_tree,1);
							//animation_reduced_barcoded_tree_depthchange_shrink(linear_tree,shown_depth,shown_depth);
							GlobalFormerDepth = shown_depth;
						}else{
							draw_barcoded_tree(linear_tree,1);
							//animation_unreduced_barcoded_tree_depthchange_shrink(linear_tree,shown_depth,shown_depth);
							GlobalFormerDepth = shown_depth;
						}
			        	changePercentage(finalValue);
			        });

			    sliderSvg.select("#back-slider").remove();
			    sliderSvg.select("#slider-g")
					.append("rect")
					.attr("id","back-slider")
					.attr("height",sliderHeight)
					.attr("width",sliderWidth)
					.attr("x",0)
					.attr("y",0)
					.attr("fill","gray");
				sliderSvg.selectAll(".slider").remove();
				sliderSvg.select("#slider-g")
					.selectAll(".slider")
					.data(widthArray)
					.enter()
					.append("rect")
					.attr("class","slider")
					.attr("id",function(d,i){
						return "slider-" + i;
					})
					.attr("x",-sliderWidth/4)
					.attr("y",function(d,i){
						var value = +d;
						return value / max * sliderHeight; 
					})
					.attr("width",sliderWidth + sliderWidth/2)
					.attr("height",sliderHandleHeight)
					.attr("fill",function(d,i){
						return handleColor[i];
					})
					.on("mouseover",function(d,i){
						d3.select(this).classed("slider-hover-" + i,true);
						var changeClass = "hover-depth-" + i;
						d3.selectAll(".num-" + i).classed(changeClass,true);
						changePercentage(widthArray[i]);
					})
					.on("mouseout",function(d,i){
						var changeClass = "hover-depth-" + i;
						d3.select(this).classed("slider-hover-" + i,false);
						d3.selectAll(".num-" + i).classed(changeClass,false);
						clearPercentage();
					})
					.call(drag);
			}