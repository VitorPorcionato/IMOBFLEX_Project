package br.com.imobflex;

import java.io.*;

interface ImageStorage {
  String save(byte[] bytes) throws IOException;

  byte[] read(String name) throws IOException;
}
