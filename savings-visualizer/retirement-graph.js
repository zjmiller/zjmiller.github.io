$(function(){
	$('[data-toggle="tooltip"]').tooltip()

	var Year = Backbone.Model.extend({
		defafults: {
			year: 2015,
			totalWealth: 0,
			yearlyTransfer: 0,
		}
	});

	var YearCollection = Backbone.Collection.extend({
		model: Year,

		startYear: 2015,

		endYear: 2055,

		initialWealth: 200000,

		interestRate: 1.06, // this is 5%

		transferBeforeRetirement: 80000,

		yearsUntilRetirement: 7,

		transferAfterRetirement: -45000,

		inflationRate: 1.015, // this is 2%

		modifiedYearlyTransfers: {

		},

		initialize: function(){
			_.bindAll(this, "calculateInflation");
			this.addAll();
			this.on("change", this.calculateAll);
		},

		addAll: function(){
			for (year = this.startYear; year <= this.endYear; year++){
				this.add({year: year});
			}

			var self = this;

			this.each(function(currentYear, index){
				var year = currentYear.get("year");

				var isBeforeRetirement = (year - self.yearsUntilRetirement) < self.startYear;

				if (self.modifiedYearlyTransfers[year]) {
					var yearlyTransfer = self.modifiedYearlyTransfers[year];
				} else {
						var isBeforeRetirement = (year - self.yearsUntilRetirement) < self.startYear;
						var yearlyTransfer = isBeforeRetirement ? self.transferBeforeRetirement : self.transferAfterRetirement;
				}

				if (currentYear.get("year") == self.startYear) {
					currentYear.set({
												totalWealth: self.initialWealth,
												yearlyTransfer: yearlyTransfer
											}, {silent: true});
				} else {
					var previousYear = self.findWhere({year: currentYear.get("year") - 1});
					var previousTotalWealth = previousYear.get("totalWealth");
					var previousYearlyTransfer = previousYear.get("yearlyTransfer");
					currentYear.set({
						totalWealth: (previousTotalWealth * self.interestRate) + previousYearlyTransfer,
												yearlyTransfer: yearlyTransfer
											}, {silent: true});
				}

				self.calculateInflation(currentYear)
			});

			this.calculateAll()

		},

		calculateInflation: function(currentYear){
			var yearsAfterRetirement = currentYear.get("year") - this.models[0].get("year") - this.yearsUntilRetirement;
			if ((currentYear.get("year") - this.first().get("year") - this.yearsUntilRetirement) > 0) {
				for (var i = 0; i < (currentYear.get("year") - this.first().get("year") - this.yearsUntilRetirement); i++) {
					currentYear.set({yearlyTransfer: currentYear.get("yearlyTransfer") * this.inflationRate}, {silent: true});
				}
			};
		},

		calculateAll: function(){
			console.log("calculating")
			var self = this;

			this.each(function(currentYear, index){
				if (currentYear.get("year") != self.startYear) {
					var previousYear = self.findWhere({year: currentYear.get("year") - 1});
					var previousTotalWealth = previousYear.get("totalWealth");
					var previousYearlyTransfer = previousYear.get("yearlyTransfer");
					currentYear.set({totalWealth: (previousTotalWealth * self.interestRate) + previousYearlyTransfer}, {silent: true});
				}
			});

			this.trigger("changed");
		},

		redoCollection: function(){
			var model;

			while (model = this.first()) {
			  model.destroy();
			}

			this.addAll();
		},
	});

	var yearCollection = new YearCollection();

	var ChartView = Backbone.View.extend({
		el: "div.chart-container",

		initialize: function(){
			this.render();
			this.listenTo(this.collection, "changed", this.render);
		},

		events: {
			"mouseenter .bar": "showInformation",
			"dblclick .bar-transfer": "showEditYearlyTransfer",
			"click .reset-transfer-values": "resetTransferValues"
		},

		showEditYearlyTransfer: function(e){
			var year = $(e.target).attr("data-year");
			var yearlyTransfer = $(e.target).attr("data-yearly-transfer");
			$(".edit-yearly-transfer-input").val(yearlyTransfer);
			$(".modal-year").html(year);
			$('#myModal').modal('show');
			setTimeout(function(){
				$(".edit-yearly-transfer-input").focus();
			}, 500);
		},

		showInformation: function(e){
			$(".specific-bar-information").show();

			var bar = e.target;
			var year = $(bar).attr("data-year");
			var totalWealth = $(bar).attr("data-total-wealth");
			var yearlyTransfer = $(bar).attr("data-yearly-transfer");

			$(".info-year").html(year)
			$(".info-total-wealth").html(commaSeparateNumber(totalWealth))
			$(".info-yearly-transfer").html(commaSeparateNumber(yearlyTransfer))

			function commaSeparateNumber(val){
			    while (/(\d+)(\d{3})/.test(val.toString())){
			      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
			    }
			    return val;
			  }
		},

		resetTransferValues: function(){
			this.collection.modifiedYearlyTransfers = {};
			this.collection.redoCollection();
		},

		options: {
			margin: {
				top: 100,
				right: 50,
				bottom: 100,
				left: 100,
			},

			chartWidthOuter: 900,

			chartHeightOuter: 600,

			axesNeedToBeShown: true,

			transitionDuration: 0 // will be set to 1000 after first render

		},

		render: function(){
			var margin = this.options.margin;
			var chartWidthOuter = this.options.chartWidthOuter;
			var chartHeightOuter = this.options.chartHeightOuter;

			d3.select("svg.chart-main")
				.attr("width", chartWidthOuter)
				.attr("height", chartHeightOuter);

			$(".chart-container").css("width", chartWidthOuter + 'px');

			var chartWidthInner = chartWidthOuter - margin.right - margin.left;
			var chartHeightInner = chartHeightOuter - margin.top - margin.bottom;

			var modelsJSON = this.collection.toJSON();

			var numOfBars = modelsJSON.length;

			var barWidth = chartWidthInner / numOfBars;

			var barContainer = d3.select("g.bars")

			var wealthArr = _.map(modelsJSON, function(d){ return d.totalWealth });

			var transferArr = _.map(modelsJSON, function(d){ return d.yearlyTransfer });

			var combinedArr = wealthArr.concat(transferArr)

			var y = d3.scale
								.linear()
								.domain([d3.min(combinedArr), d3.max(combinedArr)])
								.range([chartHeightInner, 0]);

			barContainer
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")") // margin positioning

			function calculateY(value){
				if (value < 0) return y(0);
				return  y(value);
			}

			function calculateHeight(value){
				if (value > 0) return (y(0) - calculateY(value));
				return y(value) - y(0)
			}

			var barWealth = barContainer
										.selectAll("rect.bar-wealth")
										.data(modelsJSON);

			barWealth
				.enter()
				.append("rect")
				.attr("class", "bar bar-wealth")
				.attr("x", function(d, i){ return i * barWidth})
				.attr("y", function(d, i){ return calculateY(d.totalWealth)})
				.attr("width", barWidth / 1.1)
				.attr("height", function(d, i){ return calculateHeight(d.totalWealth) })
				.style("opacity", 0);

			var barTransfer = barContainer
										.selectAll("rect.bar-transfer")
										.data(modelsJSON);

			barTransfer
				.enter()
				.append("rect")
				.attr("class", "bar bar-transfer")
				.attr("x", function(d, i){ return i * barWidth})
				.attr("y", function(d, i){ return calculateY(d.yearlyTransfer)})
				.attr("width", barWidth / 1.1)
				.attr("height", function(d, i){ return calculateHeight(d.yearlyTransfer) })
				.style("opacity", 0);

			var yFlipped = d3.scale
								.linear()
								.domain([d3.min(combinedArr), d3.max(combinedArr)])
								.range([chartHeightInner, 0]);

			var yAxis = d3.svg.axis().scale(yFlipped).orient("left");

			var datesNumber = _.map(modelsJSON, function(d){ return d.year });
			var datesString = _.map(datesNumber, function(d){ return d.toString() });
			var parseDate = d3.time.format("%Y").parse;
			var dates = _.map(datesString, function(d){ return parseDate(d) });

			var x = d3.time
								.scale()
								.domain([dates[0], dates[dates.length - 1]])
								.range([(barWidth / 2), chartWidthInner - (barWidth / 2)])

			var xAxisYear = d3.svg.axis().scale(x).orient("bottom");

			if (this.options.axesNeedToBeShown) {
				d3.select("svg.chart-main")
					.append("g")
					.attr("class", "axis-y")
					.call(yAxis)
					.attr("transform", "translate(" + (margin.left - 10) + "," + margin.top + ")")
					.selectAll("line")
					.attr("x2", chartWidthOuter);

				d3.select("svg")
					.append("g")
					.call(xAxisYear)
					.attr("class", "axis-x axis-x-year")
					.attr("transform", "translate(" + margin.left + ", " + (chartHeightOuter - margin.bottom + 10) + ")");

				this.options.axesNeedToBeShown = false;
			}

			var transitionDuration = this.options.transitionDuration;

			var t0 = d3.select("svg.chart-main").transition().duration(transitionDuration);

			t0.selectAll("rect.bar-wealth")
				.attr("x", function(d, i){ return i * barWidth})
				.attr("y", function(d, i){ return calculateY(d.totalWealth)})
				.attr("width", barWidth / 1.1)
				.attr("height", function(d, i){ return calculateHeight(d.totalWealth) })

			barWealth.attr("data-year", function(d) { return d.year })
				.attr("data-total-wealth", function(d) { return Math.round(d.totalWealth) })
				.attr("data-yearly-transfer", function(d) { return Math.round(d.yearlyTransfer) });

			t0.selectAll("rect.bar-transfer")
				.attr("x", function(d, i){ return i * barWidth})
				.attr("y", function(d, i){ return calculateY(d.yearlyTransfer)})
				.attr("width", barWidth / 1.1)
				.attr("height", function(d, i){ return calculateHeight(d.yearlyTransfer) })

			barTransfer.attr("data-year", function(d) { return d.year })
				.attr("data-total-wealth", function(d) { return Math.round(d.totalWealth) })
				.attr("data-yearly-transfer", function(d) { return Math.round(d.yearlyTransfer) });

			var t1 = t0.transition();

			t1.selectAll("rect.bar-wealth")
				.style("opacity", 0.6)

			t1.selectAll("rect.bar-transfer")
				.style("opacity", 0.6);

			d3.select("g.axis-y")
				.transition()
				.duration(transitionDuration)
				.call(yAxis)
				.selectAll("line")
				.attr("x2", chartWidthOuter);

			d3.select("g.axis-x-year")
				.transition()
				.duration(transitionDuration)
				.call(xAxisYear)

			var zeroLine = $('.axis-y text').filter(function() {
			    return $(this).text() == "0";
			}).parent().find('line');

			if (zeroLine) {
				zeroLine[0].style["stroke-width"] = "2";
				zeroLine[0].style["stroke-dasharray"] = "10 0";
			}

			barWealth
				.exit()
				.transition()
				.duration(transitionDuration)
				.style("opacity", 0)
				.remove()

			barTransfer
				.exit()
				.transition()
				.duration(transitionDuration)
				.style("opacity", 0)
				.remove();

			// Chart legend

			d3.select("svg.chart-main").append("rect").attr("class", "chart-legend")
				.attr("x", margin.left + 5)
				.attr("y", margin.top)
				.attr("width", 180)
				.attr("height", 45);

			d3.select("svg.chart-main").append("text").attr("class", "legend-text")
				.attr("x", margin.left + 45)
				.attr("y", margin.top + 16)
				.text("wealth that year")

			d3.select("svg.chart-main").append("text").attr("class", "legend-text")
				.attr("x", margin.left + 45)
				.attr("y", margin.top + 36)
				.text("saved or spent that year")

			d3.select("svg.chart-main").append("rect")
				.attr("x", margin.left + 15)
				.attr("y", margin.top + 7.5)
				.attr("width", 20)
				.attr("height", 10)
				.attr("fill", "steelBlue")

			d3.select("svg.chart-main").append("rect")
				.attr("x", margin.left + 15)
				.attr("y", margin.top + 27.5)
				.attr("width", 20)
				.attr("height", 10)
				.attr("fill", "crimson")


			if (transitionDuration == 0) this.options.transitionDuration = 1000;
		}
	});

	var SettingsView = Backbone.View.extend({
		el: ".settings-container",

		initialize: function(){
			$(".js-start-year").val(this.collection.startYear);
			$(".js-end-year").val(this.collection.endYear);
			$(".js-initial-wealth").val(this.collection.initialWealth);
			$(".js-interest-rate").val(Math.round((this.collection.interestRate - 1) * 10000) / 100);
			$(".js-years-until-retirement").val(this.collection.yearsUntilRetirement);
			$(".js-transfer-before-retirement").val(this.collection.transferBeforeRetirement);
			$(".js-transfer-after-retirement").val(this.collection.transferAfterRetirement * -1);
			$(".js-inflation-rate").val(Math.round((this.collection.inflationRate - 1) * 10000) / 100);
		},

		events: {
			"keypress .js-start-year": "setFirstYear",
			"blur .js-start-year": "setFirstYear",

			"keypress .js-end-year": "setLastYear",
			"blur .js-end-year": "setLastYear",

			"keypress .js-initial-wealth": "setInitialWealth",
			"blur .js-initial-wealth": "setInitialWealth",

			"keypress .js-interest-rate": "setInterestRate",
			"blur .js-interest-rate": "setInterestRate",

			"keypress .js-years-until-retirement": "setYearsUntilRetirement",
			"blur .js-years-until-retirement": "setYearsUntilRetirement",

			"keypress .js-transfer-before-retirement": "setTransferBeforeRetirement",
			"blur .js-transfer-before-retirement": "setTransferBeforeRetirement",

			"keypress .js-transfer-after-retirement": "setTransferAfterRetirement",
			"blur .js-transfer-after-retirement": "setTransferAfterRetirement",

			"keypress .js-inflation-rate": "setInflationRate",
			"blur .js-inflation-rate": "setInflationRate"
		},

		setFirstYear: function(e){
			if (!e.which || e.which == 13) {
				this.collection.startYear = parseInt(this.$el.find(".js-start-year").val(), 10);
				this.collection.redoCollection();
			}
		},

		setLastYear: function(e){
			if (!e.which || e.which == 13) {
				this.collection.endYear = parseInt(this.$el.find(".js-end-year").val(), 10);
				this.collection.redoCollection();
			}
		},

		setInitialWealth: function(e){
			if (!e.which || e.which == 13) {
				var newInitialWealth = parseInt(this.$el.find(".js-initial-wealth").val(), 10);
				this.collection.initialWealth = newInitialWealth;
				this.collection.models[0].set({totalWealth: newInitialWealth})
			}
		},

		setInterestRate: function(e){
			if (!e.which || e.which == 13) {
				var val = parseFloat(this.$el.find(".js-interest-rate").val(), 10);
				var interestRate = 1 + (val / 100)
				this.collection.interestRate = interestRate;
				this.collection.calculateAll();
			}
		},

		setYearsUntilRetirement: function(e){
			if (!e.which || e.which == 13) {
				var val = parseInt(this.$el.find(".js-years-until-retirement").val(), 10);
				this.collection.yearsUntilRetirement = val;
				this.collection.redoCollection();
			}
		},

		setTransferBeforeRetirement: function(e){
			if (!e.which || e.which == 13) {
				this.collection.transferBeforeRetirement = parseInt(this.$el.find(".js-transfer-before-retirement").val(), 10);
				this.collection.redoCollection();
			}
		},

		setTransferAfterRetirement: function(e){
			if (!e.which || e.which == 13) {
				this.collection.transferAfterRetirement = parseInt(this.$el.find(".js-transfer-after-retirement").val() * -1, 10);
				this.collection.redoCollection();
			}
		},

		setInflationRate: function(e){
			if (!e.which || e.which == 13) {
				var val = parseFloat(this.$el.find(".js-inflation-rate").val(), 10);
				var inflationRate = 1 + (val / 100);
				this.collection.inflationRate = inflationRate;
				this.collection.redoCollection();
			}
		}
	});

	var EditYearlyTransferModal = Backbone.View.extend({
		el: "#myModal",

		yearEditing: 0,

		events: {
			"click .edit-yearly-transfer-save": "saveYearlyTransfer",
			"keypress .edit-yearly-transfer-input": "saveYearlyTransferOnEnter"
		},

		saveYearlyTransfer: function(){
			var year = parseInt($(".modal-year").html(), 10);
			var newYearlyTransfer = parseInt($(".edit-yearly-transfer-input").val(), 10);
			this.collection.findWhere({year: year}).set({yearlyTransfer: newYearlyTransfer});

			this.collection.modifiedYearlyTransfers[year] = newYearlyTransfer;

			console.log(this.collection.modifiedYearlyTransfers)

			this.$el.modal('hide');
		},

		saveYearlyTransferOnEnter: function(e){
			if (e.which == 13){
				e.preventDefault();
				this.saveYearlyTransfer();
			}
		}

	});

	var app = new ChartView({collection: yearCollection});

	var settings = new SettingsView({collection: yearCollection});

	var editYearlyTransferModal = new EditYearlyTransferModal({collection: yearCollection});
});
