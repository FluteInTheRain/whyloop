import { Composition } from "remotion";
import { Video, VideoProps } from "./Video";
import defaultTimeline from "./timeline.json";
import { IconSheet, LibSheet, MascotSheet, MathSheet, SheetProps } from "./Sheets";
import { Avatar, AvatarProps } from "./Avatar";
import { Banner, BannerProps, Watermark } from "./ChannelArt";
import { Thumbnail, ThumbProps } from "./Thumbnail";
import { Promo, PromoProps } from "./Promo";
import promoTimeline from "../promo/timeline.json";

export const Root = () => (
  <>
  <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={30} width={800} height={800}
    defaultProps={{ variant: "A" } as AvatarProps} />
  <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
    defaultProps={{ variant: "A" } as ThumbProps} />
  <Composition id="Watermark" component={Watermark} durationInFrames={1} fps={30} width={300} height={300} />
  <Composition id="Banner" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440}
    defaultProps={{ variant: "A" } as BannerProps} />
  <Composition id="IconSheet" component={IconSheet} durationInFrames={1} fps={30} width={1920} height={1080}
    defaultProps={{ theme: "neon" } as SheetProps} />
  <Composition id="LibSheet" component={LibSheet} durationInFrames={1} fps={30} width={1920} height={1080}
    defaultProps={{ ids: [] as string[] }} />
  <Composition id="MathSheet" component={MathSheet} durationInFrames={1} fps={30} width={1920} height={1080}
    defaultProps={{ theme: "spectrum" } as SheetProps} />
  <Composition id="MascotSheet" component={MascotSheet} durationInFrames={1} fps={30} width={1920} height={1080}
    defaultProps={{ theme: "neon" } as SheetProps} />
  <Composition id="Promo" component={Promo} durationInFrames={30} fps={30} width={1920} height={1080}
    defaultProps={promoTimeline as unknown as PromoProps}
    calculateMetadata={({ props }) => ({ durationInFrames: props.scenes.reduce((a, x) => a + x.durationInFrames, 0), fps: props.fps })} />
  <Composition
    id="Main"
    component={Video}
    durationInFrames={30}
    fps={defaultTimeline.fps}
    width={1920}
    height={1080}
    defaultProps={{ timeline: defaultTimeline } as VideoProps}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.timeline.scenes.reduce((a, s) => a + s.durationInFrames, 0),
      fps: props.timeline.fps,
    })}
  />
  </>
);
