#!/usr/bin/env python
#-*- coding: utf-8 -*-

import BaseHTTPServer
import os
import shutil
import sys

class S(BaseHTTPServer.BaseHTTPRequestHandler):

    def set_headers(self):
        self.send_header("Content-Type", 'application/json; charset=UTF-8')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "*")
        self.send_header("Access-Control-Max-Age", "86400")

    def do_OPTIONS(self):
        self.do_HEAD()

    def do_GET(self):
        self.write_json()

    def do_HEAD(self):
        self.send_response(200)
        self.set_headers()
        self.send_header("Allow", "*")
        self.end_headers()

    def do_POST(self):
        self.write_json()

    def write_json(self):
        filepath = spath + self.path + '.json'
        if not os.path.exists(filepath):
            filepath = spath + '/error.json'
        print filepath
        with open(filepath, 'rb') as f:
            self.send_response(200)
            self.set_headers()
            fs = os.fstat(f.fileno())
            self.send_header("Content-Length", str(fs.st_size))
            self.end_headers()
            shutil.copyfileobj(f, self.wfile)


def run(server_class=BaseHTTPServer.HTTPServer, handler_class=S, addr="127.0.0.1", port=8001):
    server_address = (addr, port)
    httpd = server_class(server_address, handler_class)

    print("Starting httpd server on %s:%s" % (addr, port))
    httpd.serve_forever()

spath = ''

if __name__ == "__main__":
    spath = sys.path[0]
    os.chdir(spath)
    run()