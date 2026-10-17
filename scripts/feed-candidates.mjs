/**
 * Candidate domains per state, for scripts/find-feeds.mjs to validate.
 *
 * Three kinds of outlet are listed, in order of how useful they turn out to be:
 *
 * 1. States Newsroom / nonprofit state newsrooms — Alabama Reflector, Texas
 *    Tribune, Mississippi Today and the rest. These matter more than anything
 *    else here: they publish full article text in RSS, and most carry a
 *    Creative Commons licence that permits republication with attribution.
 *    That turns the whole content problem from "rewrite someone's reporting
 *    and hope" into "republish material we are licensed to use, credited".
 *    Each one's licence still has to be read — CC-BY-NC-ND forbids derivative
 *    works, which a rewrite is — but this is the category worth checking first.
 *
 * 2. Gray Television stations — WSFA, WBRC, WALB and so on. They run Arc
 *    Publishing, whose feed carries 1,700-3,600 characters of article text,
 *    and no scraping is needed to get it.
 *
 * 3. Newspapers and other stations, which mostly give 130-340 characters —
 *    below the threshold to write from. Listed so the validator can confirm
 *    that rather than leaving it assumed.
 *
 * Add to any state freely: the script reports what each domain actually
 * yields, so a wrong guess costs one HTTP request.
 */

export const CANDIDATES = {
  alabama: ["alabamareflector.com", "wsfa.com", "wbrc.com", "waff.com", "al.com", "alreporter.com"],
  alaska: ["alaskabeacon.com", "adn.com", "alaskapublic.org", "ktoo.org", "webcenter11.com"],
  arizona: ["azmirror.com", "tucson.com", "azcentral.com", "kold.com", "azpm.org", "cronkitenews.azpbs.org", "kjzz.org", "kgun9.com", "azfamily.com", "tucsonsentinel.com", "arizonaluminaria.org"],
  arkansas: ["arkansasadvocate.com", "kait8.com", "arkansasonline.com", "katv.com", "thv11.com", "arktimes.com", "kuaf.com", "5newsonline.com", "nwaonline.com", "magnoliareporter.com", "talkbusiness.net", "arkansasbusiness.com", "fayettevilleflyer.com", "kark.com", "ualrpublicradio.org", "hotsr.com", "eldoradonews.com", "pbcommercial.com", "harrisondaily.com"],
  california: ["calmatters.org", "lataco.com", "sfstandard.com", "voiceofsandiego.org", "kqed.org", "laist.com", "sandiegouniontribune.com", "mercurynews.com", "berkeleyside.org", "oaklandside.org", "edsource.org", "longbeachpost.com", "lookout.co", "sacbee.com", "kcrw.com"],
  colorado: ["coloradonewsline.com", "kktv.com", "coloradosun.com", "denverite.com", "cpr.org"],
  connecticut: ["ctmirror.org", "wfsb.com", "ctinsider.com", "ctpost.com", "ctpublic.org", "newhavenindependent.org", "ctnewsjunkie.com", "courant.com", "nhregister.com", "wshu.org"],
  delaware: ["spotlightdelaware.org", "delawareonline.com", "wboc.com", "delawarepublic.org", "wdel.com", "capegazette.com", "baytobaynews.com", "delawarebusinessnow.com", "newarkpostonline.com", "delmarvanow.com", "wrde.com", "townsquarelive.com", "delawarelive.com", "wgmd.com", "milfordlive.com", "coastalpoint.com", "doverpost.com", "delawarestatenews.net", "middletowntranscript.com"],
  florida: ["floridaphoenix.com", "wctv.tv", "wjhg.com", "orlandosentinel.com", "wusf.org"],
  georgia: ["georgiarecorder.com", "walb.com", "wtoc.com", "wrdw.com", "gpb.org"],
  hawaii: ["civilbeat.org", "hawaiinewsnow.com", "staradvertiser.com", "hawaiipublicradio.org", "khon2.com", "kitv.com", "bigislandnow.com", "mauinow.com", "hawaiitribune-herald.com", "westhawaiitoday.com", "mauinews.com", "kauainownews.com"],
  idaho: ["idahocapitalsun.com", "idahostatesman.com", "kmvt.com", "boisestatepublicradio.org", "idahoednews.org", "ktvb.com", "kivitv.com", "eastidahonews.com", "postregister.com", "idahopress.com"],
  illinois: ["capitolnewsillinois.com", "wifr.com", "chicago.suntimes.com", "wbez.org", "injusticewatch.org"],
  indiana: ["indianacapitalchronicle.com", "wndu.com", "indystar.com", "wfyi.org", "mirrorindy.org"],
  iowa: ["iowacapitaldispatch.com", "kcrg.com", "kwqc.com", "desmoinesregister.com", "iowapublicradio.org"],
  kansas: ["kansasreflector.com", "kwch.com", "kansas.com", "kcur.org", "cjonline.com", "kansaspublicradio.org", "ksnt.com", "kake.com", "hutchnews.com", "thebeaconnews.org", "kansascity.com"],
  kentucky: ["kentuckylantern.com", "wkyt.com", "wave3.com", "courier-journal.com", "wfpl.org"],
  louisiana: ["lailluminator.com", "wafb.com", "kplctv.com", "ksla.com", "nola.com"],
  maine: ["mainemorningstar.com", "wabi.tv", "pressherald.com", "bangordailynews.com", "mainepublic.org"],
  maryland: ["marylandmatters.org", "baltimorebanner.com", "baltimoresun.com", "wypr.org", "wmdt.com", "thedailyrecord.com", "wtop.com", "wbaltv.com", "foxbaltimore.com", "marylandreporter.com", "baltimorefishbowl.com", "heraldmailmedia.com"],
  massachusetts: ["commonwealthbeacon.org", "wwlp.com", "bostonglobe.com", "wbur.org", "masslive.com", "bostonherald.com", "gbh.org", "telegram.com", "berkshireeagle.com", "capecodtimes.com", "dotnews.com", "nbcboston.com", "universalhub.com", "cambridgeday.com", "eagletribune.com", "lowellsun.com", "metrowestdailynews.com", "patriotledger.com", "newbedfordlight.org", "wcvb.com", "itemlive.com", "bostonmagazine.com"],
  michigan: ["michiganadvance.com", "wilx.com", "wnem.com", "bridgemi.com", "michiganpublic.org"],
  minnesota: ["minnesotareformer.com", "kttc.com", "startribune.com", "mprnews.org", "sahanjournal.com"],
  mississippi: ["mississippitoday.org", "wlbt.com", "wdam.com", "clarionledger.com", "mpbonline.org"],
  missouri: ["missouriindependent.com", "ky3.com", "kfvs12.com", "stltoday.com", "stlpublicradio.org"],
  montana: ["dailymontanan.com", "montanafreepress.org", "billingsgazette.com", "mtpr.org", "kulr8.com", "kpax.com", "ktvq.com", "missoulian.com", "helenair.com", "bozemandailychronicle.com", "flatheadbeacon.com", "nbcmontana.com"],
  nebraska: ["nebraskaexaminer.com", "1011now.com", "omaha.com", "netnebraska.org", "flatwaterfreepress.org"],
  nevada: ["nevadacurrent.com", "kolotv.com", "reviewjournal.com", "thenevadaindependent.com", "knpr.org"],
  "new hampshire": ["newhampshirebulletin.com", "wmur.com", "unionleader.com", "nhpr.org", "concordmonitor.com", "indepthnh.org", "nhbr.com", "sentinelsource.com", "seacoastonline.com", "manchesterinklink.com", "fosters.com"],
  "new jersey": ["newjerseymonitor.com", "njspotlightnews.org", "nj.com", "whyy.org", "northjersey.com", "app.com", "newjerseyglobe.com", "njbiz.com", "courierpostonline.com", "nj1015.com", "tapinto.net", "jerseydigs.com"],
  "new mexico": ["sourcenm.com", "searchlightnm.org", "abqjournal.com", "kunm.org", "santafenewmexican.com", "krqe.com", "koat.com", "nmpoliticalreport.com", "lcsun-news.com", "nmindepth.com", "lascrucesbulletin.com", "kob.com", "krwg.org", "losalamosreporter.com", "riograndesun.com", "carlsbadcurrentargus.com", "daily-times.com", "alamogordonews.com", "taosnews.com", "nmpolitics.net"],
  "new york": ["nysfocus.com", "citylimits.org", "gothamist.com", "thecity.nyc", "syracuse.com"],
  "north carolina": ["ncnewsline.com", "witn.com", "wect.com", "newsobserver.com", "wunc.org"],
  "north dakota": ["northdakotamonitor.com", "kfyrtv.com", "valleynewslive.com", "inforum.com", "prairiepublic.org"],
  ohio: ["ohiocapitaljournal.com", "woio.com", "wtol.com", "cleveland.com", "signalcleveland.org", "dispatch.com", "cincinnati.com", "daytondailynews.com", "ideastream.org", "wosu.org", "toledoblade.com", "eyeonohio.com", "crainscleveland.com"],
  oklahoma: ["oklahomavoice.com", "kswo.com", "oklahoman.com", "kosu.org", "nondoc.com", "tulsaworld.com", "news9.com", "kfor.com", "okcfox.com", "readfrontier.org", "oklahomawatch.org", "normantranscript.com"],
  oregon: ["oregoncapitalchronicle.com", "opb.org", "oregonlive.com", "ktvz.com", "willametteweek.com"],
  pennsylvania: ["penncapital-star.com", "spotlightpa.org", "inquirer.com", "witf.org", "wtaj.com"],
  "rhode island": ["rhodeislandcurrent.com", "wjar.com", "providencejournal.com", "thepublicsradio.org", "wpri.com", "abc6.com", "golocalprov.com", "ecori.org", "upriseri.com", "newportri.com", "valleybreeze.com", "whatsupnewp.com", "warwickpost.com", "eastbayri.com", "independentri.com", "ricentral.com", "pbn.com", "rimonthly.com", "jamestownpress.com"],
  "south carolina": ["scdailygazette.com", "wistv.com", "live5news.com", "postandcourier.com", "scpublicradio.org"],
  "south dakota": ["southdakotasearchlight.com", "dakotanewsnow.com", "argusleader.com", "sdpb.org", "kotatv.com"],
  tennessee: ["tennesseelookout.com", "wmcactionnews5.com", "wvlt.tv", "tennessean.com", "wpln.org"],
  texas: ["texastribune.org", "kltv.com", "kwtx.com", "kbtx.com", "houstonchronicle.com", "sacurrent.com"],
  utah: ["utahnewsdispatch.com", "sltrib.com", "deseret.com", "kuer.org", "kslnewsradio.com", "fox13now.com", "ksl.com", "abc4.com", "heraldextra.com", "standard.net", "stgeorgeutah.com", "buildingsaltlake.com"],
  vermont: ["vtdigger.org", "wcax.com", "burlingtonfreepress.com", "vermontpublic.org", "vermontbiz.com", "timesargus.com", "rutlandherald.com", "sevendaysvt.com", "newportdispatch.com", "mychamplainvalley.com", "benningtonbanner.com"],
  virginia: ["virginiamercury.com", "whsv.com", "wdbj7.com", "richmond.com", "vpm.org"],
  washington: ["washingtonstatestandard.com", "seattletimes.com", "crosscut.com", "kuow.org", "spokesman.com", "king5.com", "komonews.com", "thenewstribune.com", "heraldnet.com", "tri-cityherald.com", "yakimaherald.com", "publicola.com", "cascadiadaily.com", "theolympian.com", "thestranger.com"],
  "west virginia": ["westvirginiawatch.com", "wsaz.com", "wdtv.com", "wvgazettemail.com", "wvpublic.org"],
  wisconsin: ["wisconsinexaminer.com", "wbay.com", "wsaw.com", "jsonline.com", "wpr.org"],
  wyoming: ["wyofile.com", "wyomingnews.com", "trib.com", "wyomingpublicmedia.org", "cowboystatedaily.com", "gillettenewsrecord.com", "jhnewsandguide.com", "sheridanmedia.com", "buckrail.com", "oilcity.news", "county10.com", "capcity.news"],
};
