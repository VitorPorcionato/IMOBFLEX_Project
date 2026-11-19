package br.com.imobflex;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ImobflexApplication {
  public static void main(String[] args) {
    SpringApplication.run(ImobflexApplication.class, args);
  }
}
