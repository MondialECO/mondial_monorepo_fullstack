# Phase 4.5 Support Source Registry

## 1. Registry Ingestion Adapters

| Source ID | Adapter Class | Scope | Authority Level | Update Cadence | Primary Domain / Purpose |
|:---|:---|:---|:---|:---|:---|
| `aides-entreprises-opendata` | `AidesEntreprisesOpenDataAdapter` | National / Inter-regional | OfficialAggregator | Monthly Bulk | Full baseline catalog bootstrap across 4,000+ French aids |
| `service-public` | `ServicePublicAdapter` | National | PrimaryOfficial | Rolling Weekly | Statutory entitlements (ACRE, ARCE, Maintien ARE) |
| `bpifrance` | `BpifranceAdapter` | National | PrimaryOfficial | Rolling Weekly | Innovation grants, Bourse French Tech, Prêt d'Honneur |
| `france-travail` | `FranceTravailAdapter` | National | PrimaryOfficial | Rolling Monthly | AIF individual training funding linked to Phase 4.4 Skills |
| `ile-de-france` | `IleDeFranceSupportAdapter` | Regional (IDF) | PrimaryOfficial | Bi-weekly | Innov'Up, Paris Region venture acceleration subsidies |
| `hauts-de-france` | `HautsDeFranceSupportAdapter` | Regional (HDF) | PrimaryOfficial | Bi-weekly | Pass Création, regional micro-credits, booster funds |
| `european-commission` | `EuropeanSupportAdapter` | European Union | PrimaryOfficial | Monthly | Erasmus for Young Entrepreneurs, Horizon Europe seed |

---

## 2. Ingestion Topology

```text
OFFICIAL / OPEN DATA SOURCES
        │
        ├── Aides-entreprises Open Data (Bulk Baseline Ingestion)
        │       └── JSON / CSV / API Sync
        │
        └── Primary Authority Adapters (High Precedence Verification)
                ├── Service-Public.fr (URSSAF / DILA)
                ├── Bpifrance API & Portal
                ├── France Travail SI
                ├── Regional Portals (Île-de-France, Hauts-de-France)
                └── European Commission / EYE
                        │
                        ▼
                Source Registry & Snapshot Provenance Store
                        │
                        ▼
                Rule Normalization Engine (VerifiedStructured / HumanValidated)
                        │
                        ▼
                Versioned Support Opportunities Collection (MongoDB)
```
