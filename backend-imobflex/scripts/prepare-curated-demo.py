"""Prepare the explicit demo catalog. Network is used only by this authoring script.
Run from the repository root with Python 3 + Pillow. Runtime uses bundled assets.
"""
import csv
import hashlib
import io
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen, Request
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'backend-imobflex/src/main/resources/demo/curated'
DEST.mkdir(exist_ok=True)

# Locations are resolved against ViaCEP; no real property number is advertised.
# city, street, title, type, purpose, sale, rent, area, beds, baths, parking, description
DATA = [
('São Caetano do Sul','Rua Alegre','Casa com jardim e varanda em São Caetano','HOUSE','BOTH',890000,3900,142,3,3,2,'Uma casa pensada para aproveitar a luz do dia: sala de estar conectada à varanda, cozinha com espaço para refeições e três dormitórios, sendo uma suíte. O jardim e o quintal permitem organizar uma horta ou uma área de descanso. Lavanderia independente e duas vagas completam a planta.'),
('São Caetano do Sul','Avenida Goiás','Apartamento com sala integrada na Avenida Goiás','APARTMENT','BOTH',740000,3100,86,2,2,1,'Planta com circulação confortável, sala para dois ambientes e varanda para plantas ou um café no fim do dia. Os dois dormitórios ficam separados da área social, com uma suíte e banheiro de apoio. Cozinha com bancada de trabalho, lavanderia ventilada e uma vaga de garagem.'),
('São Caetano do Sul','Rua Amazonas','Apartamento iluminado no centro de São Caetano','APARTMENT','SALE',580000,None,72,2,2,1,'Ambientes bem distribuídos para uma rotina prática: sala com janela ampla, cozinha independente e área de serviço reservada. Dois dormitórios acomodam diferentes arranjos de mobiliário, incluindo um espaço de trabalho. A planta oferece banheiro social, lavabo e uma vaga.'),
('São Caetano do Sul','Rua Visconde de Inhaúma','Casa térrea com quintal em São Caetano','HOUSE','SALE',980000,None,156,3,3,2,'A entrada se abre para uma sala generosa, com espaço para estar e jantar. A cozinha se conecta ao quintal, favorecendo refeições ao ar livre. São três dormitórios, uma suíte, banheiro social e banheiro de serviço, além de duas vagas. O escritório pode ocupar parte da sala sem interferir na circulação.'),
('São Paulo','Rua Domingos de Morais','Apartamento com varanda na Vila Mariana','APARTMENT','RENT',None,3200,68,2,2,1,'Apartamento com sala aberta para uma varanda de uso diário, dois dormitórios e cozinha com armários planejados ilustrados no projeto. A área de serviço tem ventilação independente. Os ambientes permitem separar trabalho e descanso, com uma vaga de garagem e dois banheiros.'),
('Santo André','Rua das Figueiras','Cobertura com terraço em Santo André','PENTHOUSE','SALE',1250000,None,184,3,3,2,'Cobertura duplex com sala de estar e jantar no piso de entrada e terraço aberto no pavimento superior. A área externa comporta mesa e estar descoberto; a parte íntima reúne três dormitórios, incluindo uma suíte. Cozinha ampla, lavanderia e duas vagas atendem a rotina da família.'),
('São Bernardo do Campo','Rua Jurubatuba','Terreno para seu projeto em São Bernardo','LAND','SALE',390000,None,250,0,0,0,'Área de 250 m² apresentada como estudo de ocupação residencial, com espaço para desenhar jardim, garagem e área construída conforme projeto. A viabilidade depende de levantamento técnico, zoneamento e aprovação municipal. Dimensões e condições de solo são ilustrativas e devem ser verificadas em uma negociação real.'),
('São Caetano do Sul','Rua Manoel Coelho','Sala comercial no centro de São Caetano','COMMERCIAL','RENT',None,1800,42,0,1,1,'Conjunto com recepção compacta, sala de trabalho iluminada e banheiro privativo. A planta permite organizar um escritório com estações e armários, mantendo a circulação livre. Uma copa de apoio e uma vaga complementam o espaço. Qualquer atividade profissional depende das licenças aplicáveis.'),
('Santo André','Avenida Portugal','Sobrado com jardim em Santo André','HOUSE','BOTH',1380000,5600,215,4,4,3,'Sobrado com quatro dormitórios e ambientes sociais no térreo, incluindo sala de jantar conectada à cozinha. O quintal dos fundos recebe uma área coberta para refeições; o jardim frontal cria uma transição entre rua e casa. Duas suítes, banheiro social e lavabo, com garagem para três veículos.'),
('São Bernardo do Campo','Avenida Caminho do Mar','Apartamento compacto no Rudge Ramos','APARTMENT','SALE',315000,None,44,1,1,1,'Uma planta compacta que aproveita cada ambiente: sala com área de jantar, cozinha linear e dormitório com espaço para armário. O banheiro tem ventilação prevista no projeto e a lavanderia fica junto à cozinha. Ideal para demonstrar uma opção de primeiro imóvel, com uma vaga de garagem.'),
('São Paulo','Rua Emílio Mallet','Cobertura com espaço gourmet no Tatuapé','PENTHOUSE','RENT',None,7900,196,3,4,2,'A área social se estende a um terraço com espaço para mesa, jardim em vasos e bancada de apoio. Três suítes oferecem privacidade para os moradores; o lavabo atende as visitas. Cozinha e lavanderia ficam em ambientes separados. Duas vagas completam esta proposta de cobertura.'),
('Sorocaba','Avenida Pereira da Silva','Casa com varanda em Santa Rosália','HOUSE','BOTH',620000,2600,112,2,2,2,'Casa com varanda voltada ao jardim e sala integrada à área de jantar. Os dois dormitórios incluem uma suíte; um ambiente flexível pode funcionar como escritório ou sala de leitura. Cozinha ventilada, lavanderia independente e quintal nos fundos, com duas vagas de garagem.'),
('Campinas','Rua Maria Monteiro','Sala comercial com copa no Cambuí','COMMERCIAL','SALE',465000,None,58,0,1,1,'Conjunto comercial com duas salas conectadas, copa de apoio e banheiro privativo. As janelas amplas favorecem a iluminação natural nas áreas de trabalho. A distribuição permite uma sala de reunião separada das estações, com uma vaga. Uso e adaptações dependem de análise técnica e das regras do edifício.'),
('São Paulo','Rua dos Pinheiros','Apartamento com varanda em Pinheiros','APARTMENT','SALE',1120000,None,92,2,2,1,'Sala de estar e jantar integrada à varanda, com abertura ampla e espaço para receber. A cozinha tem bancada contínua e acesso à lavanderia; os dois dormitórios ficam na ala íntima, com uma suíte. A planta comporta uma estação de trabalho próxima à janela sem ocupar a mesa de refeições.'),
('São Paulo','Avenida Moema','Apartamento com três dormitórios em Moema','APARTMENT','RENT',None,6800,118,3,3,2,'A entrada conduz a uma sala para dois ambientes, com varanda e espaço para mesa de seis lugares. Três dormitórios, sendo uma suíte, ficam separados da cozinha e da área de serviço. Banheiro social, lavabo e duas vagas compõem uma planta confortável para diferentes rotinas.'),
('Campinas','Rua Coronel Quirino','Cobertura com jardim no terraço em Campinas','PENTHOUSE','SALE',1680000,None,205,3,4,3,'Cobertura com terraço amplo e áreas coberta e descoberta, permitindo combinar estar, refeições e jardim em vasos. No piso íntimo, três suítes e uma sala reservada para leitura ou trabalho. Cozinha com copa, lavanderia e três vagas. As possibilidades de paisagismo são ilustrativas.'),
('Santos','Avenida Ana Costa','Apartamento arejado no Gonzaga','APARTMENT','BOTH',825000,3900,88,2,2,1,'Sala com boa abertura para luz natural e espaço para dois ambientes. Dois dormitórios, incluindo uma suíte, cozinha independente e área de serviço ventilada fazem parte da planta. O acabamento proposto privilegia tons claros e materiais de manutenção simples, com uma vaga de garagem.'),
('Santos','Rua Oswaldo Cruz','Apartamento com varanda no Boqueirão','APARTMENT','SALE',1370000,None,125,3,3,2,'Planta com varanda junto à sala, três dormitórios e circulação reservada para a área íntima. A cozinha comporta uma copa, enquanto a lavanderia tem acesso independente. Uma suíte, banheiro social e lavabo atendem os ambientes. Duas vagas e espaços amplos para diferentes configurações de mobiliário.'),
('Sorocaba','Avenida Antônio Carlos Comitre','Casa com espaço gourmet no Campolim','HOUSE','SALE',1450000,None,238,4,4,3,'Casa com ambientes sociais conectados ao quintal e varanda coberta para refeições. No pavimento superior, quatro dormitórios, incluindo duas suítes, preservam a privacidade da família. Cozinha com despensa, lavanderia e três vagas. O espaço gourmet foi pensado para receber com circulação confortável.'),
('Jundiaí','Avenida Nove de Julho','Apartamento com home office em Jundiaí','APARTMENT','RENT',None,3500,79,2,2,1,'Sala de estar com espaço para mesa de jantar e um canto de trabalho junto à janela. Dois dormitórios, uma suíte, cozinha funcional e lavanderia separada permitem organizar a rotina. A varanda amplia a área social e uma vaga completa o apartamento. Mobiliário apresentado apenas como sugestão de uso.'),
('São José dos Campos','Avenida Cassiano Ricardo','Sala de trabalho no Parque Aquarius','COMMERCIAL','RENT',None,2400,64,0,2,1,'Espaço de trabalho com recepção, sala de reunião e área aberta para estações. A copa fica resguardada da entrada e os dois banheiros atendem a equipe e os visitantes. Janelas amplas e uma vaga completam o conjunto. A ocupação deve observar as regras do condomínio e a licença da atividade.'),
('Ribeirão Preto','Avenida Presidente Vargas','Casa com jardim em Ribeirão Preto','HOUSE','SALE',890000,None,176,3,3,2,'Jardim frontal, sala de estar com abertura para a varanda e cozinha com espaço para refeições diárias. A área íntima reúne três dormitórios, uma suíte e banheiro social. O quintal comporta lazer descoberto, enquanto a lavanderia e o banheiro de apoio ficam separados da sala. Garagem com duas vagas.'),
('Indaiatuba','Rua Onze de Junho','Terreno urbano para construir em Indaiatuba','LAND','SALE',445000,None,300,0,0,0,'Lote de 300 m² usado para ilustrar o desenvolvimento de um projeto urbano com jardim e áreas de convivência. Antes de construir, é necessário verificar matrícula, levantamento planialtimétrico, recuos e parâmetros municipais. Nenhum potencial construtivo ou aprovação é garantido pelo anúncio de demonstração.'),
('São Paulo','Rua Haddock Lobo','Studio com ambientes integrados nos Jardins','APARTMENT','RENT',None,2950,36,1,1,0,'Studio com área de estar e dormitório integrados, cozinha compacta e banheiro independente. A proposta de mobiliário separa descanso e trabalho sem criar corredores. Uma janela ampla favorece a luz natural; a lavanderia é prevista em bancada própria. Não inclui vaga de garagem.'),
('São Bernardo do Campo','Rua Marechal Deodoro','Sala comercial com recepção em São Bernardo','COMMERCIAL','SALE',395000,None,53,0,1,1,'Conjunto comercial dividido entre recepção, sala principal e uma sala reservada para reuniões. Copa de apoio e banheiro privativo tornam o espaço funcional para o dia a dia. Uma vaga complementa a proposta. Fotografias e distribuição são ilustrativas; adequação e licenciamento devem ser avaliados para cada atividade.'),
]
PHOTOS = [
'1600596542815-ffad4c1539a9','1600607687939-ce8a6c25118c','1600210492486-724fe5c67fb0',
'1600585154340-be6161a56a0c','1600607687920-4e2a09cf159d','1600607687920-4e2a09cf159d',
'1500382017468-9049fed747ef','1497366754035-f200968a6e72','1600047509807-ba8f99d2cdde',
'1522708323590-d24dbb6b0267','1600566753190-17f0baa2a6c3','1600573472591-ee6b68d14c68',
'1497366811353-6870744d04b2','1600585154526-990dced4db0d','1616486338812-3dadae4b4ace',
'1600566753086-00f18fb6b3ea','1600607688969-a5bfcd646154','1600566752355-35792bedcfea',
'1600566753051-f0b89df2dd90','1560448204-e02f11c3d0e2','1497366216548-37526070297c',
'1600585152915-d208bec867a1','1500534314209-a25ddb2bd429','1502672260266-1c1ef2d93688',
'1524758631624-e2822e304c36',
]
# Distinct cover for the sixth entry.
PHOTOS[5] = '1600607687644-c7171b42498f'
PHOTOS[10] = '1600210491892-03d54c0aaf87'
PHOTOS[16] = '1600210491369-e753d80a41f3'
PHOTOS[17] = '1616486029423-aaa4789e8c9a'
PHOTOS[22] = '1526392587392-d1627b6c134a'

def fetch(url):
    return urlopen(Request(url, headers={'User-Agent':'Imobflex-demo-assets/1.0'}), timeout=35).read()

def prepare(item):
    i, row = item
    city, street = row[:2]
    location_url = f'https://viacep.com.br/ws/SP/{quote(city)}/{quote(street)}/json/'
    results = json.loads(fetch(location_url))
    valid = [r for r in results if r.get('logradouro') and not r.get('unidade')]
    preferred = {13: 'Pinheiros', 20: 'Parque Residencial Aquarius'}.get(i)
    if preferred:
        valid = [r for r in valid if r.get('bairro') == preferred]
    if not valid: raise ValueError(f'No real street found: {city}, {street}')
    address = valid[0]
    photo_url = f'https://images.unsplash.com/photo-{PHOTOS[i]}?auto=format&fit=crop&w=1280&h=960&q=82'
    photo = Image.open(io.BytesIO(fetch(photo_url))).convert('RGB')
    if photo.width < 600: raise ValueError('Photo too small')
    photo.save(DEST / f'cover-{i:02d}.jpg', quality=86, optimize=True)
    print(f'Prepared {i:02d}: {city}', flush=True)
    return address, {'index':i, 'photo':photo_url, 'location':location_url, 'address':address, 'sha256':hashlib.sha256((DEST / f'cover-{i:02d}.jpg').read_bytes()).hexdigest()}

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:
        resolved = list(pool.map(prepare, enumerate(DATA)))
    old_titles = ['Casa com jardim e espaços integrados','Apartamento para viver com conforto','Seu novo espaço perto de tudo']
    with (DEST.parent / 'properties.tsv').open(encoding='utf-8') as src:
        old_titles += [r['title'] for r in csv.DictReader(src, delimiter='\t')]
    with (DEST / 'properties.tsv').open('w', encoding='utf-8', newline='') as out:
        writer = csv.writer(out, delimiter='\t', lineterminator='\n')
        writer.writerow('title type purpose description cep street number neighborhood city state sale_price rent_price area bedrooms bathrooms parking previous_title'.split())
        for i, (row, (address, _)) in enumerate(zip(DATA, resolved)):
            city, street, title, kind, purpose, sale, rent, area, beds, baths, parking, description = row
            description += f' Referência de localização: {address["logradouro"]}, {address["bairro"]}, {city}/SP. O número não representa uma unidade real disponível.'
            writer.writerow([title, kind, purpose, description, address['cep'].replace('-',''), address['logradouro'], 's/n', address['bairro'], address['localidade'], 'SP', sale or '', rent or '', area, beds, baths, parking, old_titles[i] if i < len(old_titles) else ''])
    (DEST / 'sources.json').write_text(json.dumps([r[1] for r in resolved], ensure_ascii=False, indent=2), encoding='utf-8')
    import shutil
    for name, index in [('regions-capital',13),('regions-abc',0),('regions-interior',18)]:
        shutil.copyfile(DEST / f'cover-{index:02d}.jpg', ROOT / f'frontend-imobflex/public/{name}.jpg')
