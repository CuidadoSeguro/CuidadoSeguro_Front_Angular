# Cuidado Seguro – Frontend Administrativo

Frontend administrativo de la plataforma **Cuidado Seguro**, desarrollado con **Angular 21**.

Este proyecto corresponde a la interfaz destinada a los **usuarios internos y administradores del sistema**, permitiendo gestionar y supervisar diferentes funcionalidades administrativas de la plataforma.

---

## 📋 Descripción del proyecto

**Cuidado Seguro** es una plataforma orientada a la gestión y seguimiento de información relacionada con pacientes, profesionales de salud, tutores y familiares.

La solución contempla diferentes interfaces dependiendo del tipo de usuario:

- **Frontend Angular:** destinado a usuarios internos y administradores del sistema.
- **Frontend React:** destinado a usuarios externos, como profesionales, tutores y familiares.

Este repositorio contiene exclusivamente el **frontend Angular correspondiente al portal administrativo**.

El objetivo de este frontend es proporcionar una interfaz segura, organizada y escalable que permita a los administradores gestionar información y funcionalidades propias de la plataforma.

---

# 👥 Tipos de usuarios

La plataforma contempla diferentes tipos de usuarios.

## Usuarios internos

Los usuarios internos corresponden principalmente a los **administradores del sistema**.

El frontend utilizado para estos usuarios es:

**Angular**

Entre las funcionalidades administrativas que se contemplan se encuentran:

- Gestión de usuarios.
- Gestión de profesionales.
- Gestión de tutores y familiares.
- Gestión de pacientes.
- Administración de información de la plataforma.
- Visualización de información administrativa.
- Indicadores y reportes.

---

## Usuarios externos

Los usuarios externos utilizan el frontend desarrollado en **React**.

Entre estos usuarios se encuentran:

- Profesionales de salud.
- Tutores.
- Familiares.

El frontend React es un proyecto independiente de este repositorio.

---

# 🏗️ Arquitectura general

La arquitectura de Cuidado Seguro contempla dos aplicaciones frontend que utilizan los servicios backend de la plataforma.

```text
                           CUIDADO SEGURO
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌───────────────────┐       ┌───────────────────┐
          │ Angular Frontend  │       │  React Frontend   │
          │                   │       │                   │
          │ ADMINISTRADOR     │       │ USUARIOS EXTERNOS │
          │                   │       │                   │
          └─────────┬─────────┘       └─────────┬─────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                       ┌────────────────────┐
                       │   Azure IDaaS      │
                       │ Microsoft Entra ID │
                       │                    │
                       │ OAuth 2.0 / OIDC   │
                       └─────────┬──────────┘
                                 │
                                 ▼
                                JWT
                                 │
                                 ▼
                       ┌────────────────────┐
                       │   API Manager     │
                       │   API Gateway      │
                       └─────────┬──────────┘
                                 │
                                 ▼
                              ┌───────┐
                              │  BFF  │
                              └───┬───┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
        ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
        │ Usuario /    │  │  Pacientes   │  │ Datos Médicos  │
        │ Perfil       │  │   Service    │  │    Service      │
        │ Service      │  │              │  │                 │
        └──────┬───────┘  └──────┬───────┘  └────────┬────────┘
               │                 │                   │
               └─────────────────┼───────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Amazon RDS MySQL │
                        └──────────────────┘