CREATE DATABASE TiDb;

USE DATABASE TiDb;

CREATE TABLE violations(
    guildId VARCHAR(100),
    word VARCHAR(100),
    violationRating VARCHAR(100),
    violationType VARCHAR(100),
    userId VARCHAR(100)
);