var puppeteer = require('puppeteer');
var path = require('path');
var fs = require('fs');
var SHOTS = path.join(__dirname, '..', 'screenshots');
function wait(ms) { return new Promise(function(r){setTimeout(r,ms)}); }

(async function() {
  var browser = await puppeteer.launch({headless:true,args:['--no-sandbox'],defaultViewport:{width:1280,height:800}});
  var page = await browser.newPage();
  var errs = [];
  page.on('pageerror', function(e){ errs.push(e.message); });
  function shot(n) {
    return page.screenshot({path:path.join(SHOTS,n+'.png')}).then(function(){
      if(errs.length){console.log('!! '+n+': '+errs.join('; '));errs=[];}
      else console.log('OK '+n);
    });
  }

  await page.goto('http://localhost:8080',{waitUntil:'networkidle0'});
  await wait(500); await shot('flow_01_splash');
  await wait(2500); await shot('flow_02_home');

  await page.evaluate(function(){goChapters()}); await wait(400); await shot('flow_03_chapters');
  await page.evaluate(function(){goLessons('prep')}); await wait(400); await shot('flow_04_lessons');
  await page.evaluate(function(){startLesson('prep_lines')}); await wait(500); await shot('flow_05_listen');
  await page.evaluate(function(){currentStage='GUIDED';renderStage()}); await wait(1500); await shot('flow_06_guided');
  await page.evaluate(function(){currentStage='TRACE';renderStage()}); await wait(400); await shot('flow_07_trace');

  // 그리기 + 자동평가
  var canvas = await page.$('#writingCanvas');
  if (canvas) {
    var box = await canvas.boundingBox();
    await page.mouse.move(box.x+30, box.y+box.height/2);
    await page.mouse.down();
    for(var x=30;x<box.width-30;x+=3) await page.mouse.move(box.x+x, box.y+box.height/2);
    await page.mouse.up();
    await wait(300); await shot('flow_08_trace_drawn');
    await wait(2000); await shot('flow_09_auto_eval');
  }

  // FREE → 그리기 → PRAISE
  await wait(1500);
  canvas = await page.$('#writingCanvas');
  if (canvas) {
    var box = await canvas.boundingBox();
    await page.mouse.move(box.x+30, box.y+box.height/2);
    await page.mouse.down();
    for(var x=30;x<box.width-30;x+=3) await page.mouse.move(box.x+x, box.y+box.height/2);
    await page.mouse.up();
    await wait(2000);
  }
  await wait(1500); await shot('flow_10_praise');

  await page.evaluate(function(){goThemes()}); await wait(400); await shot('flow_11_themes');

  await page.evaluate(function(){startTheme('animals')});
  await wait(300);
  await page.evaluate(function(){currentStage='TRACE';renderStage()});
  await wait(400); await shot('flow_12_theme_trace');

  await page.evaluate(function(){startLesson('consonant_set_1')}); await wait(400); await shot('flow_13_consonant_listen');
  await page.evaluate(function(){currentStage='TRACE';renderStage()}); await wait(400); await shot('flow_14_consonant_trace');

  await page.evaluate(function(){goReview()}); await wait(400); await shot('flow_15_review');
  await page.evaluate(function(){goReward()}); await wait(400); await shot('flow_16_stickers');
  await page.evaluate(function(){goParentGate()}); await wait(400); await shot('flow_17_parent_gate');
  await page.evaluate(function(){showParentDashboard()}); await wait(400); await shot('flow_18_parent_dashboard');
  await page.evaluate(function(){goHome()}); await wait(400); await shot('flow_19_home_return');

  // 좁은 화면
  await page.setViewport({width:800,height:600});
  await page.evaluate(function(){goChapters()}); await wait(400); await shot('flow_20_small_chapters');
  await page.evaluate(function(){startTheme('nature')});
  await wait(200);
  await page.evaluate(function(){currentStage='TRACE';renderStage()});
  await wait(400); await shot('flow_21_small_trace');

  await browser.close();
  console.log('\n=== Done ===');
})();
