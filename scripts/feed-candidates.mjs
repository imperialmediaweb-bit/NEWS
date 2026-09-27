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
  arizona: ["azmirror.com", "tucson.com", "azcentral.com", "kold.com", "azpm.org"],
  arkansas: ["arkansasadvocate.com", "kait8.com", "arkansasonline.com", "katv.com", "thv11.com"],
  california: ["calmatters.org", "lataco.com", "sfstandard.com", "voiceofsandiego.org", "kqed.org"],
  colorado: ["coloradonewsline.com", "kktv.com", "coloradosun.com", "denverite.com", "cpr.org"],
  connecticut: ["ctmirror.org", "wfsb.com", "ctinsider.com", "ctpost.com", "ctpublic.org"],
  delaware: ["spotlightdelaware.org", "delawareonline.com", "wboc.com", "delawarepublic.org"],
  florida: ["floridaphoenix.com", "wctv.tv", "wjhg.com", "orlandosentinel.com", "wusf.org"],
  georgia: ["georgiarecorder.com", "walb.com", "wtoc.com", "wrdw.com", "gpb.org"],
  hawaii: ["civilbeat.org", "hawaiinewsnow.com", "staradvertiser.com", "hawaiipublicradio.org"],
  idaho: ["idahocapitalsun.com", "idahostatesman.com", "kmvt.com", "boisestatepublicradio.org"],
  illinois: ["capitolnewsillinois.com", "wifr.com", "chicago.suntimes.com", "wbez.org", "injusticewatch.org"],
  indiana: ["indianacapitalchronicle.com", "wndu.com", "indystar.com", "wfyi.org", "mirrorindy.org"],
  iowa: ["iowacapitaldispatch.com", "kcrg.com", "kwqc.com", "desmoinesregister.com", "iowapublicradio.org"],
  kansas: ["kansasreflector.com", "kwch.com", "kansas.com", "kcur.org", "cjonline.com"],
  kentucky: ["kentuckylantern.com", "wkyt.com", "wave3.com", "courier-journal.com", "wfpl.org"],
  louisiana: ["lailluminator.com", "wafb.com", "kplctv.com", "ksla.com", "nola.com"],
  maine: ["mainemorningstar.com", "wabi.tv", "pressherald.com", "bangordailynews.com", "mainepublic.org"],
  maryland: ["marylandmatters.org", "baltimorebanner.com", "baltimoresun.com", "wypr.org", "wmdt.com"],
  massachusetts: ["commonwealthbeacon.org", "wwlp.com", "bostonglobe.com", "wbur.org", "masslive.com"],
  michigan: ["michiganadvance.com", "wilx.com", "wnem.com", "bridgemi.com", "michiganpublic.org"],
  minnesota: ["minnesotareformer.com", "kttc.com", "startribune.com", "mprnews.org", "sahanjournal.com"],
  mississippi: ["mississippitoday.org", "wlbt.com", "wdam.com", "clarionledger.com", "mpbonline.org"],
  missouri: ["missouriindependent.com", "ky3.com", "kfvs12.com", "stltoday.com", "stlpublicradio.org"],
  montana: ["dailymontanan.com", "montanafreepress.org", "billingsgazette.com", "mtpr.org", "kulr8.com"],
  nebraska: ["nebraskaexaminer.com", "1011now.com", "omaha.com", "netnebraska.org", "flatwaterfreepress.org"],
  nevada: ["nevadacurrent.com", "kolotv.com", "reviewjournal.com", "thenevadaindependent.com", "knpr.org"],
  "new hampshire": ["newhampshirebulletin.com", "wmur.com", "unionleader.com", "nhpr.org", "concordmonitor.com"],
  "new jersey": ["newjerseymonitor.com", "njspotlightnews.org", "nj.com", "whyy.org", "northjersey.com"],
  "new mexico": ["sourcenm.com", "searchlightnm.org", "abqjournal.com", "kunm.org", "santafenewmexican.com"],
  "new york": ["nysfocus.com", "citylimits.org", "gothamist.com", "thecity.nyc", "syracuse.com"],
  "north carolina": ["ncnewsline.com", "witn.com", "wect.com", "newsobserver.com", "wunc.org"],
  "north dakota": ["northdakotamonitor.com", "kfyrtv.com", "valleynewslive.com", "inforum.com", "prairiepublic.org"],
  ohio: ["ohiocapitaljournal.com", "woio.com", "wtol.com", "cleveland.com", "signalcleveland.org"],
  oklahoma: ["oklahomavoice.com", "kswo.com", "oklahoman.com", "kosu.org", "nondoc.com"],
  oregon: ["oregoncapitalchronicle.com", "opb.org", "oregonlive.com", "ktvz.com", "willametteweek.com"],
  pennsylvania: ["penncapital-star.com", "spotlightpa.org", "inquirer.com", "witf.org", "wtaj.com"],
  "rhode island": ["rhodeislandcurrent.com", "wjar.com", "providencejournal.com", "thepublicsradio.org"],
  "south carolina": ["scdailygazette.com", "wistv.com", "live5news.com", "postandcourier.com", "scpublicradio.org"],
  "south dakota": ["southdakotasearchlight.com", "dakotanewsnow.com", "argusleader.com", "sdpb.org", "kotatv.com"],
  tennessee: ["tennesseelookout.com", "wmcactionnews5.com", "wvlt.tv", "tennessean.com", "wpln.org"],
  texas: ["texastribune.org", "kltv.com", "kwtx.com", "kbtx.com", "houstonchronicle.com", "sacurrent.com"],
  utah: ["utahnewsdispatch.com", "sltrib.com", "deseret.com", "kuer.org", "kslnewsradio.com"],
  vermont: ["vtdigger.org", "wcax.com", "burlingtonfreepress.com", "vermontpublic.org"],
  virginia: ["virginiamercury.com", "whsv.com", "wdbj7.com", "richmond.com", "vpm.org"],
  washington: ["washingtonstatestandard.com", "seattletimes.com", "crosscut.com", "kuow.org", "spokesman.com"],
  "west virginia": ["westvirginiawatch.com", "wsaz.com", "wdtv.com", "wvgazettemail.com", "wvpublic.org"],
  wisconsin: ["wisconsinexaminer.com", "wbay.com", "wsaw.com", "jsonline.com", "wpr.org"],
  wyoming: ["wyofile.com", "wyomingnews.com", "trib.com", "wyomingpublicmedia.org", "cowboystatedaily.com"],
};
