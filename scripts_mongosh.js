// ── Crear colecciones con validacion ─────────────────────────────────────────

db.createCollection("resenas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "id_reserva", "id_hotel", "id_cliente",
        "calificacion", "texto", "fecha_creacion",
        "estado", "destacada", "util_count"
      ],
      properties: {
        id_reserva:      { bsonType: "int" },
        id_hotel:        { bsonType: "int" },
        id_cliente:      { bsonType: "int" },
        calificacion:    { bsonType: "int" },
        texto:           { bsonType: "string" },
        fecha_creacion:  { bsonType: "date" },
        estado:          { bsonType: "string" },
        destacada:       { bsonType: "bool" },
        util_count:      { bsonType: "int" },
        respuesta_admin: { bsonType: ["object", "null"] }
      }
    }
  }
})

db.createCollection("votos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_resena", "id_usuario", "fecha"],
      properties: {
        id_resena:  { bsonType: "objectId" },
        id_usuario: { bsonType: "int" },
        fecha:      { bsonType: "date" }
      }
    }
  }
})

// ── Poblar resenas ────────────────────────────────────────────────────────────

db.resenas.insertMany([
  {
    id_reserva: NumberInt(302),
    id_hotel: NumberInt(7),
    id_cliente: NumberInt(303),
    calificacion: NumberInt(5),
    texto: "Excelente hotel, la habitacion estaba impecable y el servicio fue muy atento.",
    fecha_creacion: new Date("2026-05-01T10:00:00Z"),
    estado: "publicada",
    destacada: false,
    util_count: NumberInt(3),
    respuesta_admin: null
  },
  {
    id_reserva: NumberInt(303),
    id_hotel: NumberInt(7),
    id_cliente: NumberInt(303),
    calificacion: NumberInt(3),
    texto: "La ubicacion es buena pero el ruido del exterior fue molesto durante la noche.",
    fecha_creacion: new Date("2026-04-15T14:30:00Z"),
    estado: "publicada",
    destacada: false,
    util_count: NumberInt(1),
    respuesta_admin: {
      texto: "Lamentamos el inconveniente, tomaremos medidas para mejorar el aislamiento.",
      fecha: new Date("2026-04-16T09:00:00Z"),
      id_admin: NumberInt(1)
    }
  },
  {
    id_reserva: NumberInt(304),
    id_hotel: NumberInt(8),
    id_cliente: NumberInt(303),
    calificacion: NumberInt(4),
    texto: "Muy buena experiencia en general, el desayuno fue destacable.",
    fecha_creacion: new Date("2026-03-20T08:00:00Z"),
    estado: "publicada",
    destacada: true,
    util_count: NumberInt(5),
    respuesta_admin: null
  }
])

// ── Poblar votos (reemplazar IDs con los reales) ──────────────────────────────

db.votos.insertMany([
  { id_resena: ObjectId("6a166cee2ba9aedc1c0413d8"), id_usuario: NumberInt(4), fecha: new Date("2026-05-02T11:00:00Z") },
  { id_resena: ObjectId("6a166cee2ba9aedc1c0413d8"), id_usuario: NumberInt(5), fecha: new Date("2026-05-02T12:00:00Z") },
  { id_resena: ObjectId("6a166cee2ba9aedc1c0413d8"), id_usuario: NumberInt(6), fecha: new Date("2026-05-02T13:00:00Z") },
  { id_resena: ObjectId("6a166cee2ba9aedc1c0413d9"), id_usuario: NumberInt(4), fecha: new Date("2026-04-16T10:00:00Z") },
  { id_resena: ObjectId("6a166cee2ba9aedc1c0413da"), id_usuario: NumberInt(7), fecha: new Date("2026-03-21T09:00:00Z") }
])

// ── RFC1 - Top 10 hoteles por calificacion promedio ───────────────────────────

db.resenas.aggregate([
  { $match: { estado: "publicada" } },
  { $group: { _id: "$id_hotel", promedio_calificacion: { $avg: "$calificacion" }, total_resenas: { $sum: 1 } } },
  { $sort: { promedio_calificacion: -1 } },
  { $limit: 10 }
])

// ── RFC2 - Evolucion mensual de la reputacion de un hotel ─────────────────────

db.resenas.aggregate([
  { $match: { id_hotel: 7, estado: "publicada" } },
  { $group: { _id: { mes: { $month: "$fecha_creacion" } }, promedio_calificacion: { $avg: "$calificacion" }, total_resenas: { $sum: 1 } } },
  { $sort: { "_id.mes": 1 } }
])

// ── RFC3 - Perfil comparativo de hoteles por ciudad ───────────────────────────

db.resenas.aggregate([
  { $match: { id_hotel: { $in: [7, 8] }, estado: "publicada" } },
  { $group: {
    _id: "$id_hotel",
    promedio_calificacion: { $avg: "$calificacion" },
    total_resenas: { $sum: 1 },
    con_respuesta: { $sum: { $cond: [{ $ifNull: ["$respuesta_admin", false] }, 1, 0] } },
    destacadas: { $sum: { $cond: ["$destacada", 1, 0] } }
  }},
  { $sort: { promedio_calificacion: -1 } }
])
