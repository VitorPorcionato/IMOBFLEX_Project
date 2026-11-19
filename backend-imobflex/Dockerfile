FROM maven:3.9.11-eclipse-temurin-25 AS build
WORKDIR /workspace
COPY backend-imobflex/pom.xml backend-imobflex/pom.xml
COPY backend-imobflex/src backend-imobflex/src
COPY sql-imobflex/migrations sql-imobflex/migrations
RUN mvn -f backend-imobflex/pom.xml -B -DskipTests package
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN groupadd --system imobflex && useradd --system --gid imobflex imobflex && mkdir /app/uploads && chown imobflex:imobflex /app/uploads
COPY --from=build /workspace/backend-imobflex/target/backend-imobflex-0.1.0.jar app.jar
USER imobflex
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
