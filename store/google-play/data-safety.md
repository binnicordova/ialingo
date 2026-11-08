# Google Play: Data safety and Families answers (iaLingo 1.2)

Answers for Play Console → App content. They follow from `docs/PRIVACY.md`; re-check them whenever a feature touches data.

## Data safety form

| Question | Answer | Why |
| --- | --- | --- |
| Does your app collect or share any of the required user data types? | **No** | No accounts, analytics, ads or network calls of our own. Progress is stored only on the device. |
| Is all of the user data collected by your app encrypted in transit? | Not applicable (nothing is transmitted) | |
| Do you provide a way for users to request that their data is deleted? | **Yes**: in-app deletion (parent area → Delete player / Delete all progress), or uninstall | |

Notes for the reviewer field, if asked:

- **Audio:** speaking exercises use Android's `SpeechRecognizer` with on-device recognition. Only the recognized text reaches the app; it is scored and discarded. Nothing is recorded or uploaded. Online recognition is off unless a parent enables it, and then Google processes it under its own terms (not collected by iaLingo).
- **Voice diary:** optional, off by default, parent-enabled. Short recordings are saved in the app's private storage and never leave the device. Data processed only on the device is not "collected" under Play's definition.
- **Offline model download:** triggered by a parent, performed by Android's system service (`androidTriggerOfflineModelDownload`), and sends nothing about the child.

## Target audience and content

- **Target age groups:** 6–8 and 9–12.
- **Appeals to children:** yes. The app follows the Families Policy.
- **Ads:** none, and no ad SDK.
- **In-app purchases:** none.
- **Interactions:** no chat, no user-generated content, no links out of the app except the privacy policy. That link and sharing a certificate or postcard happen only behind the parental gate.
- **Location:** not used. `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` and the external storage permissions are blocked in `app.json`.

## Permissions declaration

| Permission | Purpose shown to reviewers |
| --- | --- |
| `RECORD_AUDIO` | Speaking practice (tap-to-talk, recognized on the device) and the optional, parent-enabled voice diary. Never in the background. |

## Content rating (IARC) questionnaire

Category: Education / Reference. Answer **No** to violence, fear, sexuality, gambling, controlled substances, crude humor, user interaction, sharing of location and digital purchases. Expected ratings: ESRB Everyone, PEGI 3, USK 0, ClassInd L.

## Teacher Approved (optional)

The app is a good fit for the "Teacher Approved" review (no ads, no purchases, a parental gate, a real curriculum). Apply only once a store build is live; the program's reviewers decide, so do not claim it in the listing.
