import { EditorialLink } from "@/components/ui/EditorialLink";
import { PublicFooterNav } from "@/components/ui/PublicFooterNav";

export default function ManifestoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pt-6 pb-6 leading-relaxed sm:px-8 md:pt-8 md:pb-8">
      <div className="mx-auto w-full max-w-[56rem]">
        <EditorialLink href="/">regresar</EditorialLink>
      </div>

      <section className="mx-auto mt-8 w-full max-w-[56rem] flex-1">
        <h1 className="text-[2.2rem] leading-none font-medium tracking-[-0.05em] text-foreground md:text-[2.8rem]">
          manifiesto
        </h1>
        <div className="mt-8 space-y-6 text-[1rem] leading-[2] text-[#262626]">
          <p>Pachuca, marzo 2026</p>

          <div className="space-y-3">
            <p className="font-medium text-foreground">Por qué existe este proyecto</p>
            <p>
              Pachuca me recibió cuando más lo necesitaba. Después de cerrar
              Funktionell, después de la pandemia, después de perder a Gordita,
              este lugar fue donde aprendí a respirar de nuevo. No elegí
              Pachuca. El destino me trajo aquí. Y Pachuca, sin proponérselo, me
              sostuvo.
            </p>
            <p>
              Este proyecto es un acto de gratitud. No un documento turístico,
              no un ensayo sociológico. Una mirada devuelta a un lugar que me
              vio cuando yo no podía verme.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">
              Lo que esta mirada ve y lo que no ve
            </p>
            <p>
              Existe una Pachuca que crece hacia el sur, que se llena de casas
              template, que busca parecerse a otras ciudades. No es esa la que
              me convoca. No porque esté mal, sino porque no es la que encuentro
              cuando camino.
            </p>
            <p>
              Mi Pachuca es la del centro. La de los edificios simples con años
              encima. La de los oficios. La del cielo azul con nubes blancas
              casi siempre. La del atardecer sobre los cerros. La de la fonda
              Katy con vista al Reloj.
            </p>
            <p>
              Esta es una mirada. No la Pachuca. Lo digo con honestidad y sin
              pretensión.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">
              El ritual y la invisibilidad
            </p>
            <p>
              Varias veces por semana camino de casa al Reloj Monumental. Podría
              comprar el jamón y el queso más cerca. Podría tomar el café en
              otro lado. Pero voy al Trico del centro, al Rucio, porque ya es un
              ritual. Y los rituales no se justifican, se practican.
            </p>
            <p>
              En esas calles no represento nada. Puedo caminar despacio, sin
              apuro, sin destino urgente. Esa invisibilidad es uno de los
              regalos más raros que me ha dado este lugar.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">
              La protesta que no se declara
            </p>
            <p>
              He sido parte del mundo que hoy miro con distancia. Lo conozco
              desde adentro, por eso lo reconozco.
            </p>
            <p>
              Portal 771 es también una protesta. Pero no se declara. Existe en
              lo que elijo fotografiar y en lo que decido no fotografiar. El
              silencio de lo que no aparece habla igual de fuerte que la imagen.
            </p>
            <p>
              Simplemente elijo mirar hacia lo que no tiene precio de mercado,
              porque eso se está volviendo escaso.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">El miedo</p>
            <p>
              Temo que esta Pachuca desaparezca. El tren nuevo, la especulación
              al sur, el turismo en los alrededores. Todo eso tiene
              consecuencias. Lo que estoy fotografiando puede no existir en diez
              años.
            </p>
            <p>
              Y temo también perder la calma que encontré aquí. ¿Qué pasa con
              esta paz?
            </p>
            <p>
              Tal vez deba aprender que la calma no vive en el lugar. Que
              Pachuca me ayudó a encontrarla, pero que ya es mía. Este proyecto
              es también una forma de anclarla. De dejar escrito en imágenes lo
              que encontré, antes de que todo cambie.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">Para quién</p>
            <p>
              Para mí. Nace de la necesidad de salir, de respirar, de pensar
              otras cosas. Si alguien más lo ve y algo le llega, bien. Pero no
              lo necesito para que el proyecto valga.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">La tecnología</p>
            <p>
              La IA, la cámara 360, el WebXR. No vienen a transformar lo que
              ven. Vienen a preservar la sensación de haberlo encontrado.
              Instrumentos silenciosos al servicio de la contemplación.
            </p>
            <p>
              Este proyecto demuestra, sin declararlo, que la tecnología puede
              tener otra relación con el tiempo. No la de la aceleración. La de
              la contemplación.
            </p>
          </div>

          <p>Documento vivo · se actualiza con el proyecto</p>
        </div>
      </section>

      <PublicFooterNav
        className="mt-8"
        primaryHref="/"
        primaryLabel="portal 771"
      />
    </main>
  );
}
