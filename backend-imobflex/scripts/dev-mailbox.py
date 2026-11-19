"""Local test mailbox, no delivery or forwarding. pip install aiosmtpd. Memory only."""
from aiosmtpd.controller import Controller
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from email import policy
from email.parser import BytesParser
import threading, uuid, json, html
messages=[]
lock=threading.Lock()
class Inbox:
 async def handle_DATA(self,server,session,envelope):
  mail=BytesParser(policy=policy.default).parsebytes(envelope.content)
  text=mail.get_body(preferencelist=("plain",)).get_content() if mail.is_multipart() else mail.get_content()
  row={"ID":str(uuid.uuid4()),"Subject":str(mail.get("Subject","")),"To":[{"Address":a} for a in envelope.rcpt_tos],"Text":text}
  with lock:messages.insert(0,row);del messages[200:]
  return "250 Message accepted for local testing"
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  with lock:rows=list(messages)
  if self.path=="/api/v1/messages":data={"messages":rows}
  elif self.path.startswith("/api/v1/message/"):data=next((m for m in rows if m["ID"]==self.path.rsplit("/",1)[-1]),{})
  else:
   self.send_response(200);self.send_header("Content-Type","text/html; charset=utf-8");self.end_headers();self.wfile.write(("<html lang='pt-BR'><meta charset='utf-8'><title>Caixa local de testes</title><h1>E-mails de teste Imobflex</h1><p>Somente memória local. Atualize a página para novas mensagens.</p>"+"".join("<article><h2>"+html.escape(m["Subject"])+"</h2><p>"+html.escape(str(m["To"]))+"</p><pre style='white-space:pre-wrap'>"+html.escape(m["Text"])+"</pre></article>" for m in rows)+"</html>").encode());return
  self.send_response(200);self.send_header("Content-Type","application/json");self.end_headers();self.wfile.write(json.dumps(data).encode())
 def log_message(self,*args):pass
if __name__=="__main__":
 Controller(Inbox(),hostname="127.0.0.1",port=1025).start()
 print("SMTP 127.0.0.1:1025; mailbox http://127.0.0.1:8025",flush=True)
 ThreadingHTTPServer(("127.0.0.1",8025),Handler).serve_forever()
