import base64
s=open('taller.src.html').read()
img=lambda f,t: f'data:image/{t};base64,'+base64.b64encode(open(f,'rb').read()).decode()
s=s.replace('__HEADER__',img('header.jpg','jpeg')).replace('__FOOTER__',img('footer.jpg','jpeg')).replace('__LOGO__',img('logo-explora-lima.png','png'))
s=s.replace('__BUYERS__',open('buyers.json').read().replace('</','<\\/'))
open('taller-reactivacion.html','w').write(s)
