FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/auth-service-0.0.1-SNAPSHOT.jar app.jar
USER 10001
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
