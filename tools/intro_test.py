from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json, os
OUT=Path('output/qa/intro'); OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('TEST_URL','http://127.0.0.1:8000/')
EXE=os.environ.get('BROWSER_PATH',r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
checks=[];errors=[]
def phase(page,value):
 page.wait_for_function('(p)=>document.querySelector("#introDialog").open && document.querySelector("#introDialog").dataset.phase===p',arg=value,timeout=22000)
def watch(page):page.on('pageerror',lambda e:errors.append(str(e)))
def complete(page):
 page.wait_for_function('!document.querySelector("#introDialog").open',timeout=20000)
 assert not page.locator('body').evaluate("e=>e.classList.contains('prelude-open')")
 assert page.locator('#introDialog').evaluate('e=>e.getAnimations({subtree:true}).length')==0
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=EXE,headless=True)
 for w,h in [(1440,960),(390,844)]:
  page=b.new_page(viewport={'width':w,'height':h});watch(page)
  page.goto(URL,wait_until='domcontentloaded')
  phases=[]
  for current in ['stars','gather','moon','clouds','silhouette','reveal','title','handoff']:
   phase(page,current);phases.append(current)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if current=='silhouette':
    brightness=page.locator('.prelude-figure').evaluate("e=>getComputedStyle(e).filter")
    assert 'brightness(1)' not in brightness
   if current=='title':
    page.wait_for_timeout(950)
    page.screenshot(path=str(OUT/f'{w}-title.png'))
    assert page.locator('#introDialog img[src]').evaluate_all('imgs=>imgs.every(i=>i.complete&&i.naturalWidth)')
   if current=='handoff':
    page.wait_for_timeout(900)
    assert float(page.locator('.prelude-composition').evaluate('e=>getComputedStyle(e).opacity'))<.01
    assert float(page.locator('.prelude-chrome').evaluate('e=>getComputedStyle(e).opacity'))<.01
    page.screenshot(path=str(OUT/f'{w}-handoff.png'))
  complete(page)
  page.locator('.hero-actions [data-open-wish]').click();expect(page.locator('#wishDialog')).to_be_visible();page.keyboard.press('Escape')
  checks.append(f'{w}px: all eight chapters, clean handoff, released modal and usable homepage')
  page.close()
 page=b.new_page(viewport={'width':1440,'height':960});watch(page);page.goto(URL,wait_until='domcontentloaded')
 phase(page,'moon')
 before=page.locator('#introDialog').evaluate('e=>e.getAnimations({subtree:true})[0].currentTime')
 page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
 page.wait_for_timeout(700)
 after=page.locator('#introDialog').evaluate('e=>e.getAnimations({subtree:true})[0].currentTime')
 assert abs(after-before)<100,(before,after)
 page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))")
 page.wait_for_timeout(250)
 assert page.locator('#introDialog').evaluate('e=>e.getAnimations({subtree:true})[0].currentTime')>after
 checks.append('Simulated document visibility pauses and resumes the shared timeline')
 page.locator('#skipBtn').click();complete(page)
 for current in ['stars','gather','clouds','reveal','title']:
  page.locator('#replayBtn').click();phase(page,current);page.locator('#skipBtn').click();complete(page)
  page.wait_for_timeout(150)
  assert not page.locator('#introDialog').evaluate('e=>e.open')
 checks.append('Skipping stars, gathering, clouds, character reveal and title leaves no active animation')
 page.locator('#replayBtn').click();phase(page,'stars');page.keyboard.press('Tab')
 assert page.evaluate("document.querySelector('#introDialog').contains(document.activeElement)")
 page.keyboard.press('Escape');complete(page);expect(page.locator('.hero-actions [data-open-wish]')).to_be_focused()
 checks.append('Modal keyboard focus, Escape dismissal and homepage focus restoration')
 page.locator('#replayBtn').click();phase(page,'moon');page.locator('#introSoundBtn').click()
 expect(page.locator('#introSoundBtn')).to_have_attribute('aria-pressed','true')
 page.locator('#skipBtn').click();expect(page.locator('#soundBtn')).to_have_attribute('aria-pressed','true');page.locator('#soundBtn').click()
 checks.append('Opening and homepage share the same user-activated sound state')
 page.locator('#replayBtn').click();phase(page,'title')
 for w,h in [(320,740),(844,390),(768,1024),(1920,1080)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(80)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  r=page.locator('.prelude-figure-anchor').bounding_box();assert r['x']>=-2 and r['x']+r['width']<=w+2,(w,r)
 page.locator('#skipBtn').click();complete(page)
 checks.append('Responsive portrait and landscape anchors remain within viewport')
 page.locator('#replayBtn').click();phase(page,'moon');page.emulate_media(reduced_motion='reduce');complete(page)
 page.locator('#replayBtn').click();expect(page.locator('#introDialog')).not_to_be_visible()
 checks.append('Changing reduced motion ends playback and suppresses replay')
 page.close()
 reduced=b.new_page(reduced_motion='reduce');watch(reduced);requested=[]
 reduced.on('request',lambda r:requested.append(r.url));reduced.goto(URL,wait_until='networkidle')
 assert not reduced.locator('#introDialog').evaluate('e=>e.open')
 assert not any('clouds_far.webp' in x for x in requested)
 checks.append('Reduced-motion visits do not fetch prelude layers')
 deep=b.new_page();watch(deep);deep.goto(URL+'#poetry',wait_until='networkidle');assert not deep.locator('#introDialog').evaluate('e=>e.open')
 checks.append('Direct links retain their destination without an opening modal')
 broken=b.new_page();watch(broken);broken.route('**/generated/moon.webp',lambda r:r.abort());broken.goto(URL,wait_until='domcontentloaded');complete(broken)
 checks.append('An unavailable layer fails open to the usable homepage')
 slow=b.new_page();watch(slow);slow.route('**/generated/moon.webp',lambda r:r.fulfill(status=200,content_type='image/webp',body=b''));slow.goto(URL,wait_until='domcontentloaded');complete(slow)
 checks.append('An undecodable layer fails open without an exception')
 assert not errors,errors
 report={'passed':len(checks),'checks':checks,'runtimeErrors':errors}
 (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2));b.close()
