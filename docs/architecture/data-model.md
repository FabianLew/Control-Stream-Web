# ControlStream Data Model

ControlStream distinguishes between two primary types of data sources.

Streams  
Datasets

---

# Streams

Streams represent event logs.

Examples:

Kafka topic  
Rabbit queue

Characteristics:

append-only  
ordered events  
time-based

Streams support:

event search  
live viewing  
replay

---

# Datasets

Datasets represent operational state.

Examples:

Postgres table  
Postgres view

Characteristics:

queryable state  
records identified by primary keys  
no inherent event timeline

Datasets support:

record search  
state inspection  
investigation pivots

---

# Investigation

Investigation combines both worlds.

Investigation results may contain:

Events (from Streams)

Records (from Datasets)

Timeline entries may contain:

EVENT  
STATE_OBSERVATION