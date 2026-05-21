CREATE DATABASE IF NOT EXISTS centros_interes;
USE centros_interes;

-- Tabla de proyectos (Centros de interés)
CREATE TABLE proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    area VARCHAR(100),
    cupos_totales INT NOT NULL,
    cupos_disponibles INT NOT NULL
);

-- Tabla de estudiantes
CREATE TABLE estudiantes (
    documento VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grado VARCHAR(10) NOT NULL,
    proyecto_id INT DEFAULT NULL,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL
);

-- Datos de prueba para Proyectos
INSERT INTO proyectos (nombre, descripcion, area, cupos_totales, cupos_disponibles) VALUES
('Robótica', 'Construcción y programación de robots y circuitos básicos.', 'Tecnología', 15, 15),
('Arte y Pintura', 'Expresión artística utilizando diferentes técnicas sobre lienzo.', 'Artes', 20, 20),
('Programación Web', 'Creación de páginas web y aplicaciones modernas.', 'Tecnología', 25, 25);

-- Datos de prueba para Estudiantes (Sin proyecto asignado aún)
INSERT INTO estudiantes (documento, nombre, grado) VALUES
('100100100', 'Juan Pérez', '10A'),
('200200200', 'María Gómez', '11B');