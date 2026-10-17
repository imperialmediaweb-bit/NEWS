/**
 * Per-state RSS feeds that actually carry article text.
 *
 * GENERATED — do not edit by hand. Regenerate with:
 *
 *   node scripts/find-feeds.mjs --all > scripts/feeds-found.json
 *   node scripts/write-state-feeds.mjs scripts/feeds-found.json
 *
 * scripts/find-feeds.mjs probes candidate publishers and measures how many
 * characters of article body each feed's items contain. Only feeds averaging
 * 500+ characters are here: below that the model would be filling in rather
 * than reporting, which is how this network came to publish invented quotes
 * attributed to real organisations.
 *
 * This replaces Google News RSS. Google News gives a headline, one sentence,
 * and a link wrapped in an opaque identifier that can no longer be resolved to
 * the publisher's URL — so there was no way to reach the article, and no
 * honest way to write one.
 *
 * How many feeds a state has decides whether it publishes at all. A state with
 * one feed runs dry the moment that publisher has a quiet day, and the
 * pipeline then reports nothing pending and nothing failed — which reads as
 * healthy. Three is the floor worth holding.
 *
 * 207 feeds across 50 states.
 */

export interface StateFeed {
  url: string;
  publisher: string;
  /** Median characters of article text per item, as measured at discovery. */
  medianChars: number;
}

export const STATE_FEEDS: Record<string, StateFeed[]> = {
  "Alabama": [
    { url: "https://alabamareflector.com/feed/", publisher: "alabamareflector.com", medianChars: 3938 },
    { url: "https://wbrc.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wbrc.com", medianChars: 1415 },
    { url: "https://wsfa.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wsfa.com", medianChars: 1381 },
    { url: "https://waff.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "waff.com", medianChars: 1357 },
  ],
  "Alaska": [
    { url: "https://alaskabeacon.com/feed/", publisher: "alaskabeacon.com", medianChars: 6059 },
    { url: "https://adn.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "adn.com", medianChars: 4228 },
    { url: "https://ktoo.org/feed/", publisher: "ktoo.org", medianChars: 2430 },
    { url: "https://webcenter11.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "webcenter11.com", medianChars: 1741 },
  ],
  "Arizona": [
    { url: "https://cronkitenews.azpbs.org/feed/", publisher: "cronkitenews.azpbs.org", medianChars: 8527 },
    { url: "https://azmirror.com/feed/", publisher: "azmirror.com", medianChars: 4704 },
    { url: "https://www.kgun9.com/index.rss", publisher: "kgun9.com", medianChars: 2682 },
    { url: "https://azfamily.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "azfamily.com", medianChars: 2172 },
    { url: "https://kold.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kold.com", medianChars: 1299 },
  ],
  "Arkansas": [
    { url: "https://arkansasadvocate.com/feed/", publisher: "arkansasadvocate.com", medianChars: 6776 },
    { url: "https://talkbusiness.net/feed/", publisher: "talkbusiness.net", medianChars: 5179 },
    { url: "https://pbcommercial.com/feed/", publisher: "pbcommercial.com", medianChars: 2821 },
    { url: "https://harrisondaily.com/feed/", publisher: "harrisondaily.com", medianChars: 2308 },
    { url: "https://kait8.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kait8.com", medianChars: 1158 },
  ],
  "California": [
    { url: "https://voiceofsandiego.org/feed/", publisher: "voiceofsandiego.org", medianChars: 5711 },
    { url: "https://calmatters.org/feed/", publisher: "calmatters.org", medianChars: 5636 },
    { url: "https://ww2.kqed.org/news/feed/", publisher: "kqed.org", medianChars: 4853 },
    { url: "https://laist.com/index.atom", publisher: "laist.com", medianChars: 3490 },
    { url: "https://laist.com/index.rss", publisher: "laist.com", medianChars: 3490 },
    { url: "https://edsource.org/feed/", publisher: "edsource.org", medianChars: 1864 },
  ],
  "Colorado": [
    { url: "https://coloradonewsline.com/feed/", publisher: "coloradonewsline.com", medianChars: 4835 },
    { url: "https://denverite.com/feed/", publisher: "denverite.com", medianChars: 4792 },
    { url: "https://cpr.org/feed/", publisher: "cpr.org", medianChars: 3079 },
    { url: "https://kktv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kktv.com", medianChars: 1158 },
  ],
  "Connecticut": [
    { url: "https://www.newhavenindependent.org/feed/", publisher: "newhavenindependent.org", medianChars: 6856 },
    { url: "https://ctmirror.org/feed/", publisher: "ctmirror.org", medianChars: 4318 },
    { url: "https://wfsb.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wfsb.com", medianChars: 639 },
  ],
  "Delaware": [
    { url: "https://capegazette.com/rss.xml", publisher: "capegazette.com", medianChars: 7794 },
    { url: "https://spotlightdelaware.org/feed/", publisher: "spotlightdelaware.org", medianChars: 5238 },
    { url: "https://www.wgmd.com/feed/", publisher: "wgmd.com", medianChars: 807 },
  ],
  "Florida": [
    { url: "https://floridaphoenix.com/feed/", publisher: "floridaphoenix.com", medianChars: 3779 },
    { url: "https://wjhg.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wjhg.com", medianChars: 1330 },
    { url: "https://wctv.tv/arc/outboundfeeds/rss/?outputType=xml", publisher: "wctv.tv", medianChars: 1105 },
  ],
  "Georgia": [
    { url: "https://georgiarecorder.com/feed/", publisher: "georgiarecorder.com", medianChars: 6686 },
    { url: "https://georgiarecorder.com/feed/localFeed/", publisher: "georgiarecorder.com", medianChars: 6437 },
    { url: "https://walb.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "walb.com", medianChars: 1533 },
    { url: "https://wrdw.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wrdw.com", medianChars: 1404 },
    { url: "https://wtoc.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wtoc.com", medianChars: 1158 },
  ],
  "Hawaii": [
    { url: "https://mauinews.com/feed/", publisher: "mauinews.com", medianChars: 3913 },
    { url: "https://bigislandnow.com/feed/", publisher: "bigislandnow.com", medianChars: 2249 },
    { url: "https://kauainownews.com/feed/", publisher: "kauainownews.com", medianChars: 2041 },
    { url: "https://hawaiinewsnow.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "hawaiinewsnow.com", medianChars: 1741 },
    { url: "https://mauinow.com/feed/", publisher: "mauinow.com", medianChars: 1584 },
    { url: "https://mauinews.com/news/feed/", publisher: "mauinews.com", medianChars: 992 },
  ],
  "Idaho": [
    { url: "https://www.idahoednews.org/feed/", publisher: "idahoednews.org", medianChars: 5783 },
    { url: "https://idahocapitalsun.com/feed/", publisher: "idahocapitalsun.com", medianChars: 3053 },
    { url: "https://www.kivitv.com/index.rss", publisher: "kivitv.com", medianChars: 1971 },
  ],
  "Illinois": [
    { url: "https://www.injusticewatch.org/feed/", publisher: "injusticewatch.org", medianChars: 6241 },
    { url: "https://www.wbez.org/rss/index.xml", publisher: "wbez.org", medianChars: 4651 },
    { url: "https://chicago.suntimes.com/rss/index.xml", publisher: "chicago.suntimes.com", medianChars: 3988 },
    { url: "https://wifr.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wifr.com", medianChars: 1122 },
  ],
  "Indiana": [
    { url: "https://mirrorindy.org/feed/", publisher: "mirrorindy.org", medianChars: 10407 },
    { url: "https://indianacapitalchronicle.com/feed/localFeed/", publisher: "indianacapitalchronicle.com", medianChars: 5227 },
    { url: "https://wndu.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wndu.com", medianChars: 1505 },
  ],
  "Iowa": [
    { url: "https://iowacapitaldispatch.com/feed/", publisher: "iowacapitaldispatch.com", medianChars: 5387 },
    { url: "https://kcrg.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kcrg.com", medianChars: 1158 },
    { url: "https://kwqc.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kwqc.com", medianChars: 1122 },
  ],
  "Kansas": [
    { url: "https://thebeaconnews.org/feed/", publisher: "thebeaconnews.org", medianChars: 8572 },
    { url: "https://kansasreflector.com/feed/", publisher: "kansasreflector.com", medianChars: 4610 },
    { url: "https://kwch.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kwch.com", medianChars: 1158 },
  ],
  "Kentucky": [
    { url: "https://wfpl.org/feed/", publisher: "wfpl.org", medianChars: 4493 },
    { url: "https://kentuckylantern.com/feed/", publisher: "kentuckylantern.com", medianChars: 4236 },
    { url: "https://wfpl.org/index.rss", publisher: "wfpl.org", medianChars: 2938 },
    { url: "https://wave3.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wave3.com", medianChars: 1122 },
    { url: "https://wkyt.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wkyt.com", medianChars: 713 },
  ],
  "Louisiana": [
    { url: "https://lailluminator.com/feed/", publisher: "lailluminator.com", medianChars: 4561 },
    { url: "https://wafb.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wafb.com", medianChars: 1741 },
    { url: "https://kplctv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kplctv.com", medianChars: 1698 },
    { url: "https://ksla.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "ksla.com", medianChars: 1122 },
  ],
  "Maine": [
    { url: "https://mainemorningstar.com/feed/", publisher: "mainemorningstar.com", medianChars: 6600 },
    { url: "https://www.bangordailynews.com/feed/", publisher: "bangordailynews.com", medianChars: 3802 },
    { url: "https://wabi.tv/arc/outboundfeeds/rss/?outputType=xml", publisher: "wabi.tv", medianChars: 1385 },
    { url: "https://pressherald.com/news/feed/", publisher: "pressherald.com", medianChars: 701 },
    { url: "https://pressherald.com/politics/feed/", publisher: "pressherald.com", medianChars: 553 },
  ],
  "Maryland": [
    { url: "https://marylandreporter.com/feed/", publisher: "marylandreporter.com", medianChars: 6489 },
    { url: "https://marylandmatters.org/feed/", publisher: "marylandmatters.org", medianChars: 5885 },
    { url: "https://wtop.com/local/feed/", publisher: "wtop.com", medianChars: 3080 },
    { url: "https://wtop.com/feed/", publisher: "wtop.com", medianChars: 2158 },
    { url: "https://baltimorefishbowl.com/feed/", publisher: "baltimorefishbowl.com", medianChars: 1605 },
  ],
  "Massachusetts": [
    { url: "https://bostonmagazine.com/news/feed/", publisher: "bostonmagazine.com", medianChars: 12731 },
    { url: "https://newbedfordlight.org/feed/", publisher: "newbedfordlight.org", medianChars: 8458 },
    { url: "https://commonwealthbeacon.org/feed/", publisher: "commonwealthbeacon.org", medianChars: 5835 },
    { url: "https://bostonglobe.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "bostonglobe.com", medianChars: 4760 },
    { url: "https://bostonmagazine.com/feed/", publisher: "bostonmagazine.com", medianChars: 3789 },
    { url: "https://universalhub.com/rss.xml", publisher: "universalhub.com", medianChars: 1075 },
  ],
  "Michigan": [
    { url: "https://bridgemi.com/feed/", publisher: "bridgemi.com", medianChars: 6991 },
    { url: "https://www.michiganpublic.org/index.rss", publisher: "michiganpublic.org", medianChars: 3593 },
    { url: "https://michiganadvance.com/feed/", publisher: "michiganadvance.com", medianChars: 3343 },
    { url: "https://wilx.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wilx.com", medianChars: 1158 },
    { url: "https://wnem.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wnem.com", medianChars: 808 },
  ],
  "Minnesota": [
    { url: "https://sahanjournal.com/feed/", publisher: "sahanjournal.com", medianChars: 10897 },
    { url: "https://minnesotareformer.com/feed/", publisher: "minnesotareformer.com", medianChars: 6600 },
    { url: "https://www.mprnews.org/feed/homepage", publisher: "mprnews.org", medianChars: 4614 },
    { url: "https://kttc.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kttc.com", medianChars: 1122 },
  ],
  "Mississippi": [
    { url: "https://mississippitoday.org/feed/", publisher: "mississippitoday.org", medianChars: 3403 },
    { url: "https://mississippitoday.org/news/feed/", publisher: "mississippitoday.org", medianChars: 3403 },
    { url: "https://wlbt.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wlbt.com", medianChars: 1158 },
    { url: "https://wdam.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wdam.com", medianChars: 952 },
  ],
  "Missouri": [
    { url: "https://missouriindependent.com/feed/", publisher: "missouriindependent.com", medianChars: 6671 },
    { url: "https://ky3.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "ky3.com", medianChars: 1293 },
    { url: "https://kfvs12.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kfvs12.com", medianChars: 875 },
  ],
  "Montana": [
    { url: "https://montanafreepress.org/feed/", publisher: "montanafreepress.org", medianChars: 5938 },
    { url: "https://dailymontanan.com/feed/", publisher: "dailymontanan.com", medianChars: 4561 },
    { url: "https://dailymontanan.com/feed/localFeed/", publisher: "dailymontanan.com", medianChars: 4428 },
    { url: "https://flatheadbeacon.com/feed/", publisher: "flatheadbeacon.com", medianChars: 4119 },
    { url: "https://www.kpax.com/index.rss", publisher: "kpax.com", medianChars: 2009 },
    { url: "https://www.ktvq.com/index.rss", publisher: "ktvq.com", medianChars: 968 },
  ],
  "Nebraska": [
    { url: "https://flatwaterfreepress.org/feed/", publisher: "flatwaterfreepress.org", medianChars: 7174 },
    { url: "https://nebraskaexaminer.com/feed/", publisher: "nebraskaexaminer.com", medianChars: 3856 },
    { url: "https://1011now.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "1011now.com", medianChars: 1181 },
  ],
  "Nevada": [
    { url: "https://nevadacurrent.com/politics/feed/", publisher: "nevadacurrent.com", medianChars: 5399 },
    { url: "https://nevadacurrent.com/feed/", publisher: "nevadacurrent.com", medianChars: 5321 },
    { url: "https://thenevadaindependent.com/feed/", publisher: "thenevadaindependent.com", medianChars: 5043 },
  ],
  "New Hampshire": [
    { url: "https://newhampshirebulletin.com/feed/", publisher: "newhampshirebulletin.com", medianChars: 4772 },
    { url: "https://www.nhbr.com/feed/", publisher: "nhbr.com", medianChars: 3932 },
    { url: "https://indepthnh.org/feed/", publisher: "indepthnh.org", medianChars: 3619 },
    { url: "https://unionleader.com/rss.xml", publisher: "unionleader.com", medianChars: 1187 },
  ],
  "New Jersey": [
    { url: "https://newjerseymonitor.com/feed/", publisher: "newjerseymonitor.com", medianChars: 3856 },
    { url: "https://newjerseyglobe.com/feed/", publisher: "newjerseyglobe.com", medianChars: 3008 },
    { url: "https://njbiz.com/feed/", publisher: "njbiz.com", medianChars: 2929 },
    { url: "https://jerseydigs.com/feed/", publisher: "jerseydigs.com", medianChars: 2402 },
    { url: "https://whyy.org/feed/", publisher: "whyy.org", medianChars: 1280 },
  ],
  "New Mexico": [
    { url: "https://searchlightnm.org/feed/", publisher: "searchlightnm.org", medianChars: 8671 },
    { url: "https://nmpolitics.net/index/feed/", publisher: "nmpolitics.net", medianChars: 6687 },
    { url: "https://sourcenm.com/feed/", publisher: "sourcenm.com", medianChars: 3547 },
    { url: "https://kob.com/feed/", publisher: "kob.com", medianChars: 1177 },
    { url: "https://losalamosreporter.com/feed/", publisher: "losalamosreporter.com", medianChars: 1158 },
  ],
  "New York": [
    { url: "https://nysfocus.com/feed", publisher: "nysfocus.com", medianChars: 6702 },
    { url: "https://citylimits.org/feed/", publisher: "citylimits.org", medianChars: 5444 },
    { url: "https://thecity.nyc/feed/", publisher: "thecity.nyc", medianChars: 4220 },
  ],
  "North Carolina": [
    { url: "https://ncnewsline.com/feed/", publisher: "ncnewsline.com", medianChars: 4290 },
    { url: "https://witn.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "witn.com", medianChars: 1158 },
    { url: "https://wect.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wect.com", medianChars: 1158 },
  ],
  "North Dakota": [
    { url: "https://northdakotamonitor.com/feed/", publisher: "northdakotamonitor.com", medianChars: 5419 },
    { url: "https://www.inforum.com/index.rss", publisher: "inforum.com", medianChars: 3239 },
    { url: "https://kfyrtv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kfyrtv.com", medianChars: 1158 },
    { url: "https://valleynewslive.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "valleynewslive.com", medianChars: 1158 },
  ],
  "Ohio": [
    { url: "https://signalcleveland.org/feed/", publisher: "signalcleveland.org", medianChars: 6281 },
    { url: "https://ohiocapitaljournal.com/feed/localFeed/", publisher: "ohiocapitaljournal.com", medianChars: 4430 },
    { url: "https://ohiocapitaljournal.com/feed/", publisher: "ohiocapitaljournal.com", medianChars: 3838 },
  ],
  "Oklahoma": [
    { url: "https://readfrontier.org/politics/feed/", publisher: "readfrontier.org", medianChars: 6365 },
    { url: "https://www.readfrontier.org/feed/", publisher: "readfrontier.org", medianChars: 6326 },
    { url: "https://oklahomavoice.com/feed/", publisher: "oklahomavoice.com", medianChars: 5086 },
    { url: "https://oklahomawatch.org/feed/", publisher: "oklahomawatch.org", medianChars: 4270 },
    { url: "https://kswo.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kswo.com", medianChars: 960 },
  ],
  "Oregon": [
    { url: "https://oregoncapitalchronicle.com/feed/", publisher: "oregoncapitalchronicle.com", medianChars: 5713 },
    { url: "https://opb.org/arc/outboundfeeds/rss/?outputType=xml", publisher: "opb.org", medianChars: 4864 },
    { url: "https://ktvz.com/feed/", publisher: "ktvz.com", medianChars: 1306 },
    { url: "https://ktvz.com/local-news/feed/", publisher: "ktvz.com", medianChars: 867 },
  ],
  "Pennsylvania": [
    { url: "https://penncapital-star.com/feed/", publisher: "penncapital-star.com", medianChars: 3760 },
    { url: "https://inquirer.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "inquirer.com", medianChars: 2268 },
    { url: "https://witf.org/feed/", publisher: "witf.org", medianChars: 1503 },
  ],
  "Rhode Island": [
    { url: "https://ecori.org/feed/", publisher: "ecori.org", medianChars: 6044 },
    { url: "https://rhodeislandcurrent.com/feed/", publisher: "rhodeislandcurrent.com", medianChars: 4561 },
    { url: "https://whatsupnewp.com/feed/", publisher: "whatsupnewp.com", medianChars: 3062 },
    { url: "https://www.rimonthly.com/feed/", publisher: "rimonthly.com", medianChars: 2346 },
    { url: "https://jamestownpress.com/feed/", publisher: "jamestownpress.com", medianChars: 1468 },
  ],
  "South Carolina": [
    { url: "https://scdailygazette.com/feed/", publisher: "scdailygazette.com", medianChars: 4685 },
    { url: "https://wistv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wistv.com", medianChars: 1734 },
    { url: "https://live5news.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "live5news.com", medianChars: 877 },
  ],
  "South Dakota": [
    { url: "https://southdakotasearchlight.com/feed/", publisher: "southdakotasearchlight.com", medianChars: 4684 },
    { url: "https://kotatv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kotatv.com", medianChars: 1562 },
    { url: "https://dakotanewsnow.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "dakotanewsnow.com", medianChars: 1158 },
  ],
  "Tennessee": [
    { url: "https://tennesseelookout.com/feed/", publisher: "tennesseelookout.com", medianChars: 4561 },
    { url: "https://wpln.org/feed/", publisher: "wpln.org", medianChars: 3266 },
    { url: "https://wvlt.tv/arc/outboundfeeds/rss/?outputType=xml", publisher: "wvlt.tv", medianChars: 1266 },
    { url: "https://wmcactionnews5.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wmcactionnews5.com", medianChars: 1122 },
  ],
  "Texas": [
    { url: "https://www.sacurrent.com/feed/", publisher: "sacurrent.com", medianChars: 4953 },
    { url: "https://kwtx.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kwtx.com", medianChars: 1158 },
    { url: "https://kltv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kltv.com", medianChars: 1141 },
    { url: "https://kbtx.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "kbtx.com", medianChars: 1036 },
  ],
  "Utah": [
    { url: "https://www.deseret.com/rss/latest.rss", publisher: "deseret.com", medianChars: 5593 },
    { url: "https://utahnewsdispatch.com/feed/", publisher: "utahnewsdispatch.com", medianChars: 4329 },
    { url: "https://www.fox13now.com/index.rss", publisher: "fox13now.com", medianChars: 2011 },
  ],
  "Vermont": [
    { url: "https://vtdigger.org/feed/", publisher: "vtdigger.org", medianChars: 6782 },
    { url: "https://vermontbiz.com/rss.xml", publisher: "vermontbiz.com", medianChars: 3009 },
    { url: "https://www.sevendaysvt.com/feed/", publisher: "sevendaysvt.com", medianChars: 2732 },
    { url: "https://wcax.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wcax.com", medianChars: 1158 },
    { url: "https://www.newportdispatch.com/feed/", publisher: "newportdispatch.com", medianChars: 1122 },
  ],
  "Virginia": [
    { url: "https://virginiamercury.com/feed/", publisher: "virginiamercury.com", medianChars: 4439 },
    { url: "https://wdbj7.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wdbj7.com", medianChars: 1741 },
    { url: "https://whsv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "whsv.com", medianChars: 1158 },
  ],
  "Washington": [
    { url: "https://crosscut.com/politics/feed/", publisher: "crosscut.com", medianChars: 5567 },
    { url: "https://crosscut.com/news/feed/", publisher: "crosscut.com", medianChars: 5135 },
    { url: "https://www.cascadiadaily.com/feed/", publisher: "cascadiadaily.com", medianChars: 4608 },
    { url: "https://washingtonstatestandard.com/feed/", publisher: "washingtonstatestandard.com", medianChars: 4042 },
    { url: "https://www.thestranger.com/feed/", publisher: "thestranger.com", medianChars: 1875 },
  ],
  "West Virginia": [
    { url: "https://westvirginiawatch.com/feed/", publisher: "westvirginiawatch.com", medianChars: 5771 },
    { url: "https://wdtv.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wdtv.com", medianChars: 1142 },
    { url: "https://wsaz.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wsaz.com", medianChars: 636 },
  ],
  "Wisconsin": [
    { url: "https://wisconsinexaminer.com/feed/", publisher: "wisconsinexaminer.com", medianChars: 4561 },
    { url: "https://wsaw.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wsaw.com", medianChars: 1514 },
    { url: "https://wbay.com/arc/outboundfeeds/rss/?outputType=xml", publisher: "wbay.com", medianChars: 1369 },
  ],
  "Wyoming": [
    { url: "https://capcity.news/politics/feed/", publisher: "capcity.news", medianChars: 6221 },
    { url: "https://oilcity.news/politics/feed/", publisher: "oilcity.news", medianChars: 6078 },
    { url: "https://wyofile.com/feed/", publisher: "wyofile.com", medianChars: 5585 },
    { url: "https://oilcity.news/feed/", publisher: "oilcity.news", medianChars: 3114 },
    { url: "https://capcity.news/feed/", publisher: "capcity.news", medianChars: 1970 },
    { url: "https://capcity.news/news/feed/", publisher: "capcity.news", medianChars: 1970 },
    { url: "https://sheridanmedia.com/feed/", publisher: "sheridanmedia.com", medianChars: 1628 },
    { url: "https://county10.com/feed/", publisher: "county10.com", medianChars: 1567 },
    { url: "https://sheridanmedia.com/news/feed/", publisher: "sheridanmedia.com", medianChars: 1091 },
    { url: "https://buckrail.com/feed/", publisher: "buckrail.com", medianChars: 638 },
  ],
};

/** The feeds for a state, best first. Empty for a state we have none for. */
export function feedsForState(state: string): StateFeed[] {
  return STATE_FEEDS[state] || [];
}
