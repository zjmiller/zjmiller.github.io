"use strict";

const LABEL_WIDTH = 100;
const BAR_WIDTH = 30;
const DEFAULT_BAR_COLOR = '#0099ff';
const DEFAULT_POSITIVE_UTILITY_COLOR = '#33ee66';
const DEFAULT_NEGATIVE_UTILITY_COLOR = '#ff6633';

const AnimalDatum = function(numOfAnimalsKilled, lifespanInWeeks, lifespanInWords, qualityOfLife, label){
  this._numOfAnimalsKilled = numOfAnimalsKilled;
  this._lifespanInWeeks = lifespanInWeeks;
  this._lifespanInWords = lifespanInWords;
  this._qualityOfLife = qualityOfLife;
  this._label = label;
  
  this.get = function(property){
    if (property === 'numOfAnimalsKilled') return this._numOfAnimalsKilled;
    if (property === 'lifespanInWeeks') return this._lifespanInWeeks;
    if (property === 'lifespanInWords') return this._lifespanInWords;
    if (property === 'qualityOfLife') return this._qualityOfLife;
    if (property === 'label') return this._label;
    
    if (property === 'numOfYears') {
      return (this.get('lifespanInWeeks') / 52) * this.get('numOfAnimalsKilled');
    }
    
    if (property === 'aggregateUtility') {
      return this.get('numOfYears') * this.get('qualityOfLife');
    }
  }
  
  this.set = function(property, value){
    if (property === 'qualityOfLife') {
      this._qualityOfLife = value;
    }
  }
}

const animalData = [ 
  new AnimalDatum(8666662000, 6, 'six weeks', 3, 'Meat Chickens'),
  
  new AnimalDatum(57000000, 52, 'one year', -4, 'Broiler Breeders'),
  
  new AnimalDatum(277000000, 52, 'one year', -7, 'Egg-Laying Hens'),
  
  new AnimalDatum(277000000, 1 / 7, 'one day', -1, 'Male Chicks'),
  
  new AnimalDatum(240000000, 52 / 2, 'six months', 3, 'Turkeys'),
  
  new AnimalDatum(112147900, 52 / 2, 'six months', -2, 'Meat Pigs'),
  
  new AnimalDatum(1500000, 4 * 52, 'four years', -7, 'Breeding Sows'),
  
  new AnimalDatum(34200000, 1.5 * 52, 'eighteen months', 8, 'Beef Cow'),
  
  new AnimalDatum(2500000, 4 * 52, 'four years', 4, 'Milk Cow')
];

animalData.pluck = function(property){
  return animalData.map(elem => {
    return elem.get(property);
  });
}

function maxValue(arr){
  return Math.max(...arr)
}

function minValue(arr){
  return Math.min(...arr)
}

function maxAbsoluteValue(arr){
  const newArr = arr.map((elem) => {return Math.abs(elem)});
  return maxValue(newArr);
}

function maxAbsoluteValueOrAbsoluteValueTotal(arr){
  const maxAbs = maxAbsoluteValue(arr);
  const maxAbsValTot = Math.abs(arr.reduce((prevValue, curValue, curIndex, array) => {
      return prevValue + curValue;
    })
  );
  
  if (maxAbs >= maxAbsValTot) {
    return maxAbs;
  }  
  else return maxAbsValTot;
}

function calcRange(arr){
  const maxVal = maxValue(arr);
  const minVal = 0 ? minValue(arr) > 0 : minValue(arr);
  return maxVal - minVal;
}

function addCommasToInteger(i){
  // Check to make sure argument is integer
  if (i - Math.floor(i) !== 0) throw new Error("addCommasToInteger only works with integer parameter values, but you passed in: " + i);

  // Convert integer argument to string
  var str = i + '';

  var isNegative = true ? str.substr(0, 1) === '-' : false;
  
  console.log(isNegative);
  
  if (isNegative) {
    str = str.substr(1);
  }

  // Measure length of string
  var len = str.length;

  var areCommasNecessary = len / 3 > 1; 
  if (!areCommasNecessary) return str;

  var numOfCommasToInsert = Math.ceil(len / 3) - 1;

  var resultWithCommas = '';

  // Start by adding characters that appear before the first comma
  resultWithCommas = resultWithCommas 
      + str.substr(0, len - (numOfCommasToInsert * 3))
      + ',';

  for (var i = 1; i <= numOfCommasToInsert; i++){ 
    // Check to see if this is the last comma
    if (i == numOfCommasToInsert) {
      resultWithCommas = resultWithCommas + str.substr(-3, 3);
      break;
    }
  
    // Add a comma other than the last comma
    resultWithCommas = resultWithCommas + str.substr((numOfCommasToInsert - (i - 1)) * -3, 3) + ',';
  }

  if (isNegative){
    resultWithCommas = '-' + resultWithCommas;
  }

  return resultWithCommas;
}

function addLabelsToYAxis(property){
  $('.y-axis').html('');
  
  let scale;
  let firstLabel;
  
  if (property !== 'aggregateUtility') {
    scale = calculateScale(property);
    firstLabel = roundDownToMultipleOfOrderOfMagnitude(sumArray(animalData.pluck(property)));
  }
  
  if (property === 'aggregateUtility') {
     scale = calculateScaleForAggregateUtility(property);
    firstLabel = roundDownToMultipleOfOrderOfMagnitude(maxAbsoluteValueOrAbsoluteValueTotal(animalData.pluck(property)));
  }
  
  for (let i = 0; i < 5; i++){
    $('<div>')
      .addClass('y-axis-label')
      .css('top', (490 - scale(firstLabel / Math.pow(2, i))) + 'px')
      .html(addCommasToInteger(firstLabel / Math.pow(2, i)))
      .append('<div class="y-axis-line"></div>')
      .appendTo('.y-axis');
  }
  
$('<div>')
  .addClass('y-axis-label')
  .css('top', (490 + 'px'))
  .html('0')
  .append('<div class="y-axis-line"></div>')
  .appendTo('.y-axis');
}

function calculatePercentage(relativeAmount, property){
  const totalAmount = sumArray(animalData.pluck(property));
  return Math.round((relativeAmount / totalAmount) * 100);
}

function sumAbsValues(arr){
  return arr.reduce((prevValue, curValue, curIndex, array) => {
    return prevValue + Math.abs(curValue);
  }, 0);
}

function calculateAggregateUtilityPercentage(relativeAmount){
  const rawPercent = Math.abs(relativeAmount) / sumAbsValues(animalData.pluck('aggregateUtility'));
  const cleanPercent = Math.round(rawPercent * 100);
  return cleanPercent;
}

function sumArray(arr){
  return arr.reduce((prevValue, curValue, curIndex, array) =>{
    return prevValue + curValue;
  });
}

function calculateScale(property){
  const heightOfContainer = $('.bars-container').height();
  //const maxValueOfProperty = maxValue(animalData.pluck(property))
  const maxValueOfProperty = sumArray(animalData.pluck(property))
  return (num) => {return num * (heightOfContainer / maxValueOfProperty)};
}

function calculateScaleForAggregateUtility(property){
  const heightOfContainer = $('.bars-container').height();
  const maxValueOfAggregateUtility = maxAbsoluteValueOrAbsoluteValueTotal(animalData.pluck(property));
  return (num) => {return num * (heightOfContainer / maxValueOfAggregateUtility)};
}

function calculateHeight(num, property){
  return calculateScale(property)(num);
}

function calculateHeightForAggregateUtility(num, property){
  return calculateScaleForAggregateUtility(property)(num);
}

function roundDownToMultipleOfOrderOfMagnitude(num){
  const int = Math.round(num);
  const intStr = int + '';
  const firstDigit = intStr.substr(0, 1);
  const len = intStr.length;
  let roundedVersionStr = firstDigit;
  for (let i = 1; i < len; i++) roundedVersionStr += '0';
  return +roundedVersionStr;
}

function sumValues(property){
  const values = animalData.pluck(property);
  return values.reduce((prevValue, curValue, curIndex, array) =>{
    return prevValue + curValue;
  });
}

function drawGraph(property){
  if (property == "aggregateUtility") return drawGraphForAggregateUtility(property);
  
  $('.bar').css('background-color', DEFAULT_BAR_COLOR);
  
  let i = 0
  
  for (; i < animalData.length; i++){
    $('.bar').eq(i).css('height', Math.ceil(calculateHeight(animalData[i].get(property), property)));
    $('.percentage-label')
      .eq(i)
      .html(calculatePercentage(animalData[i].get(property), property) + '%')
  }
  
  $('.bar').eq(i).css('height', calculateHeight(sumValues(property), property));
  
  $('.percentage-label')
    .eq(i)
    .html(calculatePercentage(sumValues(property), property) + '%');
  
  addLabelsToYAxis(property);
}

function drawGraphForAggregateUtility(property){
  let i = 0
  
  for (; i < animalData.length; i++){
    if (animalData[i].get(property) >= 0){
      $('.bar').eq(i)
        .css('height', Math.ceil(calculateHeightForAggregateUtility(animalData[i].get(property), property)))
        .css('background-color', DEFAULT_POSITIVE_UTILITY_COLOR);
    } else {
      $('.bar').eq(i)
        .css('height', -1 * Math.ceil(calculateHeightForAggregateUtility(animalData[i].get(property), property)))
        .css('background-color', DEFAULT_NEGATIVE_UTILITY_COLOR);  
    }
    
    $('.percentage-label')
      .eq(i)
      .html(calculateAggregateUtilityPercentage(animalData[i].get(property), property) + '%');
  }  
  
  const total = sumValues(property, property);
   
  if (total >= 0) {
    $('.bar').eq(i)
      .css('height', calculateHeightForAggregateUtility(total, property))
      .css('background-color', DEFAULT_POSITIVE_UTILITY_COLOR); 
  } else {
    $('.bar').eq(i)
      .css('height', calculateHeightForAggregateUtility(-total, property))
      .css('background-color', DEFAULT_NEGATIVE_UTILITY_COLOR);  
  }
  
  $('.percentage-label')
    .eq(i)
    .html(calculateAggregateUtilityPercentage(total, property) + '%');
    
  addLabelsToYAxis(property);
}

$(function(){
  let i = 0;
  
  for (; i < animalData.length; i++){
    const noBr = $('<span>')
      .css('display', 'inline-block')
      .css('width', '240px')
      .css('text-align', 'right')
    
    const uaLabel = $('<span>')
      .addClass('utility-adjuster-label')
      .html(animalData[i].get('label'))
      .appendTo(noBr);
    
    const uaInput = $('<input>')
      .attr('type', 'text')
      .addClass('utility-adjuster-input')
      .data('animal-id', i)
      .val(animalData[i].get('qualityOfLife'))
      .appendTo(noBr);
      
    noBr.appendTo('.utility-adjuster-container');
      
    $('<div>')
      .addClass('zjm-label')
      .html(animalData[i].get('label'))
      .css('left', (LABEL_WIDTH * i) + (BAR_WIDTH / 2) + 'px')
      .css('width', LABEL_WIDTH + 'px')
      .appendTo('.labels-container');
    
    const bar = $('<div>')
      .addClass('bar')
      .css('left', (LABEL_WIDTH * i) + (LABEL_WIDTH / 2) + 'px')
      .data('animal-id', i)
      .appendTo('.bars-container');
      
    $('<div>')
      .addClass('percentage-label')
      .css('top', '-20px') 
      .css('width', BAR_WIDTH)
      .data('animal-id', i)
      .appendTo(bar);  
    
    let barInfo = $('<div>')
      .addClass('bar-info')
      .html($('#bar-info-template').html())
      .css('top', '-240px') 
      .css('left', -200 + BAR_WIDTH / 2) // width 400px in css
      .attr('data-animal-id', i)
      .appendTo(bar);  
    
    barInfo.find('.close-bar-info').data('animal-id', i);  
    
    barInfo.find('.bar-info-animal-label').html(animalData[i].get('label'));
    
    barInfo.find('.bar-info-property-label[data-prop="numOfAnimalsKilled"]').html('# of animals killed');
    barInfo.find('.bar-info-property-value[data-prop="numOfAnimalsKilled"]').html(addCommasToInteger(Math.round(animalData[i].get('numOfAnimalsKilled'))));
    
    barInfo.find('.bar-info-property-label[data-prop="lifespanInWords"]').html('age of slaughter');
    barInfo.find('.bar-info-property-value[data-prop="lifespanInWords"]').html(animalData[i].get('lifespanInWords'));
    
    barInfo.find('.bar-info-property-label[data-prop="numOfYears"]').html('total years lived');
    barInfo.find('.bar-info-property-value[data-prop="numOfYears"]').html(addCommasToInteger(Math.round(animalData[i].get('numOfYears'))));
  
    barInfo.find('.bar-info-property-label[data-prop="qualityOfLife"]').html('utility / time');
    
    barInfo.find('.bar-info-property-label[data-prop="aggregateUtility"]').html('total aggregate utility');  
  }
  
  const uaSource = $('<span>')
  .addClass('utility-adjuster-source')
  .html('Default values taken from <i>Compassion by the Pound</i>')
  .appendTo('.utility-adjuster-container');
  
  $('.utility-adjuster-input').keydown( e => {
    if (e.which == 13) {
      const animalId = $(e.target).data('animal-id');
      const newQualityOfLife = +$(e.target).val();
      animalData[animalId].set('qualityOfLife', newQualityOfLife);
      $('.bar-info:visible').find('.bar-info-property-value[data-prop="qualityOfLife"]').html(animalData[animalId].get('qualityOfLife'));
      $('.bar-info:visible').find('.bar-info-property-value[data-prop="aggregateUtility"]').html(addCommasToInteger(Math.round(animalData[animalId].get('aggregateUtility'))));
      drawGraph('aggregateUtility');
    }
  })
  
  $('<div>')
    .addClass('zjm-label')
    .html('Total')
    .css('left', (LABEL_WIDTH * i) + (BAR_WIDTH / 2) + 'px')
    .css('width', LABEL_WIDTH + 'px')
    .appendTo('.labels-container');

  const bar = $('<div>')
    .addClass('bar')
    .css('left', (LABEL_WIDTH * i) + (LABEL_WIDTH / 2) + 'px')
    .appendTo('.bars-container');
  
  $('<div>')
    .addClass('percentage-label')
    .html('100%')
    .css('top', '-20px') 
    .css('width', BAR_WIDTH)
    .appendTo(bar);   
  
  drawGraph("numOfAnimalsKilled");
  
  addLabelsToYAxis("numOfAnimalsKilled");
  
  $('.js-redraw').click(e => {
    const prop = $(e.target).data('prop');
    drawGraph(prop)
  });
  
  $('.bar, .percentage-label').on('mouseenter', e => {
    const animalId = $(e.target).data('animal-id');
    
    // Hide and reset info box that's not selected
    $('.bar-info[data-animal-id!="'+ animalId+ '"]').hide().css({
      top: '-240px',
      opacity: 0
    });
    
    // Show selected info box
    $('[data-animal-id="'+ animalId+ '"]').find('.bar-info-property-value[data-prop="qualityOfLife"]').html(animalData[animalId].get('qualityOfLife'));
    $('[data-animal-id="'+ animalId+ '"]').find('.bar-info-property-value[data-prop="aggregateUtility"]').html(addCommasToInteger(Math.round(animalData[animalId].get('aggregateUtility'))));
    
    $('[data-animal-id="'+ animalId+ '"]').show();
    $('[data-animal-id="'+ animalId+ '"]').animate({
      top: '-230px',
      opacity: 1
    }, 200);
  });
  
  $('.close-bar-info').on('click', e => {
    const animalId = $(e.target).data('animal-id');
    
    // Hide and reset selected info box
    $('.bar-info[data-animal-id="'+ animalId+ '"]').hide().css({
      top: '-240px',
      opacity: 0
    });
  });
});