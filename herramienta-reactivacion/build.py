import base64
s=open('taller.src.html').read()
img=lambda f,t: f'data:image/{t};base64,'+base64.b64encode(open(f,'rb').read()).decode()
s=s.replace('__HEADER__',img('header.jpg','jpeg')).replace('__FOOTER__',img('footer.jpg','jpeg')).replace('__LOGO__',img('logo-explora-lima.png','png'))
import os
G='/root/.claude/uploads/4d63b61e-a94b-5fba-a63a-36ddfc07292c/da50a109-ABCGravity-Condensed.otf'
if os.path.exists('fonts/gravity.otf'): G='fonts/gravity.otf'
s=s.replace('__GRAVITY__','data:font/otf;base64,'+base64.b64encode(open(G,'rb').read()).decode())
s=s.replace('__BUYERS__',open('buyers.json').read().replace('</','<\\/'))
open('taller-reactivacion.html','w').write(s)
