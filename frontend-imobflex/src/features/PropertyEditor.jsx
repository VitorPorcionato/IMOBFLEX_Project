"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { labels, imageUrl } from "@/lib/format";
import { Field, Notice } from "@/components/Fields";
export default function PropertyEditor({ id }) {
  const router = useRouter();
  const [property, setProperty] = useState(null),
    [options, setOptions] = useState([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [fields, setFields] = useState({});
  useEffect(() => {
    api("/users/options")
      .then(setOptions)
      .catch((e) => setError(e.message));
    if (id)
      api(`/properties/${id}`)
        .then(setProperty)
        .catch((e) => setError(e.message));
  }, [id]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    for (const key of [
      "bedrooms",
      "bathrooms",
      "parking",
      "owner_id",
      "broker_id",
    ])
      data[key] = Number(data[key]);
    for (const key of ["sale_price", "rent_price"])
      if (!data[key]) data[key] = null;
    data.cep = data.cep.replace(/\D/g, "");
    try {
      if (id) {
        await api(`/properties/${id}`, { method: "PUT", body: data });
        setMessage("Dados salvos.");
      } else {
        const created = await api("/properties", {
          method: "POST",
          body: data,
        });
        router.replace(`/painel/imoveis/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
      setFields(err.fields || {});
    } finally {
      setBusy(false);
    }
  }
  async function cep(e) {
    const input = e.currentTarget.form.elements.cep,
      form = input.form,
      value = input.value.replace(/\D/g, "");
    if (value.length !== 8) return;
    const previous = Object.fromEntries(
      ["street", "neighborhood", "city", "state"].map((name) => [
        name,
        form.elements[name].value,
      ]),
    );
    try {
      const res = await fetch(`https://viacep.com.br/ws/${value}/json/`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.erro) throw new Error();
      if (input.value.replace(/\D/g, "") !== value) return;
      for (const [name, key] of [
        ["street", "logradouro"],
        ["neighborhood", "bairro"],
        ["city", "localidade"],
        ["state", "uf"],
      ])
        if (data[key] && form.elements[name].value === previous[name])
          form.elements[name].value = data[key];
    } catch {
      setMessage(
        "Consulta de CEP indisponível. Preencha o endereço manualmente.",
      );
    }
  }
  async function upload(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    try {
      await api(`/properties/${id}/images`, {
        method: "POST",
        body: new FormData(form),
      });
      setProperty(await api(`/properties/${id}`));
      setMessage("Fotografias adicionadas.");
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function imageAction(image, action) {
    try {
      await api(
        `/properties/${id}/images/${image}` +
          (action === "cover" ? "/cover" : ""),
        { method: action === "cover" ? "PUT" : "DELETE" },
      );
      setProperty(await api(`/properties/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }
  if (id && !property)
    return (
      <>
        <Notice message={error} />
        <p>Carregando imóvel…</p>
      </>
    );
  const p = property || {};
  return (
    <>
      <h3>{id ? "Editar imóvel" : "Cadastrar imóvel"}</h3>
      <Notice message={error} />
      <Notice message={message} success />
      <p>
        Preenchimento manual disponível.{" "}
        <button
          type="button"
          className="btn secondary small"
          form="property-editor"
          onClick={cep}
        >
          Consultar CEP no ViaCEP
        </button>{" "}
        Ao consultar, o CEP será enviado ao ViaCEP.
      </p>
      <form
        id="property-editor"
        key={id || "new"}
        onSubmit={save}
        className="stack mt-5"
      >
        <div className="field-grid">
          <div className="wide">
            <Field
              label="Título do anúncio"
              name="title"
              required
              maxLength={160}
              defaultValue={p.title}
              error={fields.title}
            />
          </div>
          <label>
            Tipo
            <select name="type" defaultValue={p.type || "HOUSE"}>
              {[
                "HOUSE",
                "APARTMENT",
                "PENTHOUSE",
                "LAND",
                "COMMERCIAL",
                "WAREHOUSE",
              ].map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Finalidade
            <select name="purpose" defaultValue={p.purpose || "SALE"}>
              {["SALE", "RENT", "BOTH"].map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Preço de venda (R$)"
            name="sale_price"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={p.sale_price}
          />
          <Field
            label="Aluguel mensal (R$)"
            name="rent_price"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={p.rent_price}
          />
          <Field
            label="CEP"
            name="cep"
            required
            maxLength={9}
            defaultValue={p.cep}
          />
          <Field
            label="Rua"
            name="street"
            required
            defaultValue={p.street}
            maxLength={200}
          />
          <Field
            label="Número / complemento"
            name="number"
            required
            defaultValue={p.number}
            maxLength={20}
          />
          <Field
            label="Bairro"
            name="neighborhood"
            required
            defaultValue={p.neighborhood}
            maxLength={100}
          />
          <Field
            label="Cidade"
            name="city"
            required
            defaultValue={p.city}
            maxLength={100}
          />
          <Field
            label="UF"
            name="state"
            required
            pattern="[A-Z]{2}"
            maxLength={2}
            defaultValue={p.state}
          />
          {[
            ["area", "Área total (m²)"],
            ["bedrooms", "Quartos"],
            ["bathrooms", "Banheiros"],
            ["parking", "Vagas"],
          ].map(([name, label]) => (
            <Field
              key={name}
              label={label}
              name={name}
              type="number"
              min={name === "area" ? ".01" : "0"}
              step={name === "area" ? ".01" : "1"}
              required
              defaultValue={p[name] ?? (name === "area" ? "" : 0)}
            />
          ))}
          <label>
            Proprietário
            <select
              aria-label="Proprietário"
              name="owner_id"
              required
              defaultValue={p.owner_id || ""}
            >
              <option value="">Selecione</option>
              {options
                .filter((o) => o.role === "OWNER")
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Corretor responsável
            <select
              aria-label="Corretor responsável"
              name="broker_id"
              required
              defaultValue={p.broker_id || ""}
            >
              <option value="">Selecione</option>
              {options
                .filter((o) => ["BROKER", "ADMIN"].includes(o.role))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="wide">
            Descrição
            <textarea
              aria-label="Descrição"
              name="description"
              required
              minLength={50}
              maxLength={10000}
              defaultValue={p.description}
            />
            <small className="muted">
              Mínimo de 50 caracteres. Descreva os espaços e diferenciais reais.
            </small>
          </label>
        </div>
        <button className="btn justify-self-start" disabled={busy}>
          {id ? "Salvar dados" : "Salvar e adicionar fotos"}
        </button>
      </form>
      {id && <EntryRule id={id} property={p} />}
      {id && (
        <section className="mt-10">
          <h3>Fotografias</h3>
          <p>
            Inclua entre 3 e 20 imagens JPG ou PNG, até 5 MB cada. A primeira
            imagem será a capa.
          </p>
          <form onSubmit={upload} className="stack mb-6">
            <label>
              Adicionar imagens
              <input
                name="files"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                required
              />
            </label>
            <button
              className="btn secondary justify-self-start"
              disabled={busy}
            >
              Enviar fotografias
            </button>
          </form>
          <div className="grid grid-cols-2 gap-5">
            {p.images?.map((image, i) => (
              <div className="card" key={image.id}>
                <img
                  src={imageUrl(image.thumbnail)}
                  alt={`Fotografia ${i + 1}`}
                  className="property-photo"
                />
                <div className="p-3 actions">
                  <button
                    className="btn secondary small"
                    onClick={() => imageAction(image.id, "cover")}
                  >
                    {i === 0 ? "Capa atual" : "Usar como capa"}
                  </button>
                  <button
                    className="btn secondary small"
                    onClick={() => imageAction(image.id, "delete")}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 muted">
            Novos imóveis ficam pendentes até a aprovação do administrador no
            painel de imóveis.
          </p>
        </section>
      )}
    </>
  );
}

function EntryRule({ id, property }) {
  const [message, setMessage] = useState("");
  return (
    <details className="privacy-panel mt-8">
      <summary>Regra de entrada com CPF (administrador)</summary>
      <p>
        Ative apenas por exigência documentada do local. Para remover a regra,
        deixe a vigência vazia.
      </p>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await api(`/admin/properties/${id}/entry`, {
              method: "PUT",
              body: { ...d, until: d.until || null },
            });
            setMessage("Regra salva. Atualize a página para consultar.");
          } catch (err) {
            setMessage(err.message);
          }
        }}
      >
        <Field
          label="Justificativa documentada"
          name="reason"
          defaultValue={property.entry_reason || ""}
          maxLength={500}
        />
        <Field
          label="Destinatário no controle de entrada"
          name="recipient"
          defaultValue={property.entry_recipient || ""}
          maxLength={200}
        />
        <Field
          label="Vigente até"
          name="until"
          type="date"
          defaultValue={property.entry_until || ""}
        />
        <button className="btn secondary">Salvar regra</button>
        <p role="status">{message}</p>
      </form>
    </details>
  );
}
