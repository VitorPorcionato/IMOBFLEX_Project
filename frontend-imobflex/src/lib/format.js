export const labels = {
  SALE: "Venda",
  RENT: "Locação",
  BOTH: "Venda e locação",
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  PENTHOUSE: "Cobertura",
  LAND: "Terreno",
  COMMERCIAL: "Sala comercial",
  WAREHOUSE: "Galpão",
  PENDING: "Aguardando aprovação",
  AVAILABLE: "Disponível",
  NEGOTIATING: "Em negociação",
  SOLD: "Vendido",
  RENTED: "Locado",
  INACTIVE: "Inativo",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Não compareceu",
  CLIENT: "Cliente",
  BROKER: "Corretor",
  ADMIN: "Administrador",
  OWNER: "Proprietário",
};
export const money = (value) =>
  value == null
    ? ""
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }).format(Number(value));
export const dateTime = (value) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
export const imageUrl = (name) =>
  name ? `/api/v1/public/images/${name}` : "/property-placeholder.svg";
export function safeNext(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/imoveis";
}
