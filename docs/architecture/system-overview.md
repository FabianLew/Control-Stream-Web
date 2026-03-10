# ControlStream System Overview

ControlStream is a platform designed for operational investigation of event-driven systems.

The system is composed of three main components:

Frontend  
Cloud  
Agent

---

# Frontend

The frontend is responsible for:

- investigation UI
- search interface
- timeline visualization
- dataset browsing

The frontend communicates only with the Cloud API.

It never communicates directly with Agents.

---

# Cloud

The Cloud service provides:

- authentication
- workspace management
- API endpoints for frontend
- WebSocket tunnel to agents

Cloud does not perform heavy data processing.

Most operational logic lives in the Agent.

---

# Agent

The Agent runs inside customer infrastructure.

Responsibilities:

- connecting to Kafka
- connecting to RabbitMQ
- connecting to databases
- event search
- dataset queries
- investigation search
- timeline reconstruction

Payload data never leaves the customer environment.

Only investigation results are returned.

---

# Investigation workflow

Typical workflow:

User performs search  
→ Agent searches events and datasets  
→ grouped results returned  
→ user explores events or records  
→ user opens timeline  
→ user pivots between related data

Investigation is the central user experience of ControlStream.