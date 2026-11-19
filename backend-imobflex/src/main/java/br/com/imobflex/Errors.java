package br.com.imobflex;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
class Errors {
  @ExceptionHandler(Fault.class)
  ResponseEntity<ProblemDetail> fault(Fault e) {
    return problem(e.status, e.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> validation(MethodArgumentNotValidException e) {
    var p =
        ProblemDetail.forStatusAndDetail(
            HttpStatusCode.valueOf(400), "Confira os campos informados.");
    Map<String, String> errors = new LinkedHashMap<>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f -> errors.put(f.getField(), f.getDefaultMessage()));
    p.setProperty("errors", errors);
    return ResponseEntity.badRequest().body(p);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ProblemDetail> conflict() {
    return problem(409, "Dados duplicados ou operação incompatível com o histórico.");
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<ProblemDetail> invalid() {
    return problem(400, "Formato de dados inválido.");
  }

  @ExceptionHandler({MaxUploadSizeExceededException.class, javax.imageio.IIOException.class})
  ResponseEntity<ProblemDetail> upload() {
    return problem(400, "Envie imagens JPG ou PNG válidas, de até 5 MB cada.");
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ProblemDetail> unexpected(Exception e) {
    org.slf4j.LoggerFactory.getLogger(Errors.class).error("Unexpected request failure", e);
    return problem(500, "Não foi possível concluir a operação. Tente novamente.");
  }

  private ResponseEntity<ProblemDetail> problem(int status, String detail) {
    return ResponseEntity.status(status)
        .body(ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(status), detail));
  }
}
