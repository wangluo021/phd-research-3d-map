// -----------------------------------------------------------------------------
// RESEARCH MAP CONTENT
// Edit this file to update text, papers, branches, and image paths.
//
// To add your own image:
// 1) Put the image in assets/images/
// 2) Set preview and/or images[].src below, for example:
//    preview: "assets/images/my-real-result.png"
//    images: [{ src: "assets/images/my-real-result.png", caption: "Abaqus result" }]
// -----------------------------------------------------------------------------

window.researchTree = {
  id: "core",
  name: "PhD Research",
  category: "core",
  description: "Two connected research themes: advanced composite manufacturing and advanced battery manufacturing, both organized from materials and processing to multiscale modeling, validation, and performance.",
  preview: "assets/images/core-workflow.svg",
  images: [
    { src: "assets/images/core-workflow.svg", caption: "Two-theme research framework" }
  ],
  models: [
    "Theme I — Composite Manufacturing & Multiscale Modeling",
    "Theme II — Battery Manufacturing & Multiscale Modeling",
    "Material → Process → Structure → Property / Performance",
    "Simulation → Experiment → Validation → Optimization"
  ],
  papers: [],
  next: [
    "Develop each theme into a coherent dissertation chapter group",
    "Connect multiscale modeling with experimentally measurable process outcomes"
  ],
  children: [
    {
      id: "composite-theme",
      name: "Theme I — Composite Manufacturing & Multiscale Modeling",
      category: "composites",
      description: "Pultrusion-centered composite manufacturing research linking cure chemistry, process simulation, fiber architecture, interfaces, experiments, and process optimization.",
      preview: "assets/images/pultrusion.svg",
      images: [
        { src: "assets/images/pultrusion.svg", caption: "Pultrusion manufacturing and digital-twin concept" },
        { src: "assets/images/thermal-field.svg", caption: "Thermal and cure evolution" },
        { src: "assets/images/polymer-network.svg", caption: "Polyurethane molecular network" },
        { src: "assets/images/fiber-architecture.svg", caption: "Fiber architecture and permeability" }
      ],
      models: [
        "Pultrusion process modeling",
        "Fiber architecture and structural performance",
        "Polymer / interface molecular modeling",
        "Experimental validation",
        "Process optimization and industrial translation"
      ],
      papers: [
        { title: "A Theory-Guided Machine Learning and Molecular Dynamics Approach for Characterizing Fast-Curing Polyurethane Systems", meta: "Polymers, 2026", url: "https://doi.org/10.3390/polym18060679" },
        { title: "Thermo-Chemical Modeling and Experimental Validation of Pultruded Glass Fiber Reinforced Composites", meta: "Solid State Phenomena, 2026", url: "https://doi.org/10.4028/p-Wf7rKC" },
        { title: "Beyond Homogeneity: Fiber Architecture Effects on the Structural Performance of Pultruded Thermoset Composites", meta: "SAMPE 2026", url: "https://doi.org/10.33599/nasampe/s.26.32" }
      ],
      next: [
        "Unify thermo-chemical, force, and fiber-architecture models",
        "Use experimental pulling-force data for industrial validation",
        "Translate the model hierarchy into process-design guidance"
      ],
      children: [
        {
          id: "pultrusion-process",
          name: "Pultrusion Process Modeling",
          category: "composites",
          description: "Thermo-chemical, mechanical, and reduced-order modeling of continuous-fiber pultrusion from the heated die to process-window optimization.",
          preview: "assets/images/pultrusion.svg",
          images: [
            { src: "assets/images/pultrusion.svg", caption: "Pultrusion process / heated die" },
            { src: "assets/images/thermal-field.svg", caption: "Temperature and degree-of-cure field" },
            { src: "assets/images/mesh-model.svg", caption: "Multi-fidelity finite-element representation" },
            { src: "assets/images/pareto.svg", caption: "Process optimization / Pareto analysis" }
          ],
          models: [
            "Thermo-chemical and cure modeling",
            "3D / 2D / 1D multi-fidelity modeling",
            "Pulling-force prediction",
            "GPR surrogate and process optimization"
          ],
          papers: [
            { title: "Thermo-Chemical Modeling and Experimental Validation of Pultruded Glass Fiber Reinforced Composites", meta: "Solid State Phenomena, 2026", url: "https://doi.org/10.4028/p-Wf7rKC" }
          ],
          next: ["Couple gel-front evolution with pulling force", "Validate optimized conditions on the industrial pultrusion line"],
          children: [
            {
              id: "thermo-cure",
              name: "Thermo-Chemical & Cure Modeling",
              category: "composites",
              description: "Temperature, cure kinetics, exotherm, viscosity, degree of cure, and gel-front evolution through the pultrusion die.",
              preview: "assets/images/thermal-field.svg",
              images: [
                { src: "assets/images/thermal-field.svg", caption: "Thermal / DoC field" },
                { src: "assets/images/pultrusion.svg", caption: "Heated die configuration" }
              ],
              models: ["Kamal–Sourour cure kinetics", "Heat transfer + exotherm", "Chemo-rheological viscosity", "Gel-front tracking"],
              papers: [],
              next: ["Evaluate pulling-speed / die-temperature combinations", "Add uncertainty bounds to DoC prediction"]
            },
            {
              id: "multi-fidelity",
              name: "3D / 2D / 1D Multi-Fidelity Models",
              category: "composites",
              description: "A hierarchical modeling framework balancing local physical fidelity and computational efficiency.",
              preview: "assets/images/mesh-model.svg",
              images: [
                { src: "assets/images/mesh-model.svg", caption: "Finite-element model hierarchy" },
                { src: "assets/images/pultrusion.svg", caption: "Pultrusion geometry" }
              ],
              models: ["3D high-fidelity FE", "2D planar FE", "1D reduced-order model", "Cross-model comparison"],
              papers: [],
              next: ["Quantify discrepancy between fidelities", "Use the 1D model for rapid design-space exploration"]
            },
            {
              id: "force-optimization",
              name: "Pulling Force & Process Optimization",
              category: "composites",
              description: "Pulling-resistance modeling, DOE, Gaussian-process surrogates, sensitivity analysis, and Pareto process optimization.",
              preview: "assets/images/pareto.svg",
              images: [
                { src: "assets/images/pareto.svg", caption: "Pareto / sensitivity visualization" },
                { src: "assets/images/load-cell.svg", caption: "Pulling-force validation concept" }
              ],
              models: ["Pulling-force model", "DOE / LHS", "GPR surrogate", "Pareto frontier"],
              papers: [],
              next: ["Validate model using load-cell measurements", "Define robust process windows with uncertainty"]
            }
          ]
        },
        {
          id: "fiber-structure",
          name: "Fiber Architecture & Structural Performance",
          category: "composites",
          description: "Fiber-distribution effects on resin impregnation, permeability, stress transfer, and structural performance of pultruded composites.",
          preview: "assets/images/fiber-architecture.svg",
          images: [
            { src: "assets/images/fiber-architecture.svg", caption: "Fiber patterns and flow pathways" },
            { src: "assets/images/mesh-model.svg", caption: "Fiber-resolved structural model" }
          ],
          models: ["Hexagonal / quadratic / random patterns", "Permeability and impregnation", "Fiber-resolved structural response", "Battery-separator beam application"],
          papers: [
            { title: "Beyond Homogeneity: Fiber Architecture Effects on the Structural Performance of Pultruded Thermoset Composites", meta: "SAMPE 2026", url: "https://doi.org/10.33599/nasampe/s.26.32" }
          ],
          next: ["Connect fiber architecture to guidance-card design", "Use more realistic tow / bundle morphology"]
        },
        {
          id: "composite-molecular",
          name: "Polymer & Interface Molecular Modeling",
          category: "composites",
          description: "Atomistic and molecular-scale modeling of polyurethane curing and polymer–fiber interfaces to support continuum manufacturing models.",
          preview: "assets/images/polymer-network.svg",
          images: [
            { src: "assets/images/polymer-network.svg", caption: "Crosslinked polyurethane molecular network" },
            { src: "assets/images/pp-carbon-interface.svg", caption: "PP / carbon-fiber interface" },
            { src: "assets/images/pp-cellulose.svg", caption: "PP / cellulose interface" },
            { src: "assets/images/tg-curve.svg", caption: "Cure-dependent Tg relationship" }
          ],
          models: ["PU cure + MD + GPR", "PP / carbon-fiber interface", "PP / cellulose interface", "Atomistic-to-continuum property linkage"],
          papers: [
            { title: "A Theory-Guided Machine Learning and Molecular Dynamics Approach for Characterizing Fast-Curing Polyurethane Systems", meta: "Polymers, 2026", url: "https://doi.org/10.3390/polym18060679" }
          ],
          next: ["Transfer MD-informed properties to process FE models", "Compute interfacial work of adhesion"],
          children: [
            {
              id: "pu-md",
              name: "PU Cure + MD + GPR",
              category: "composites",
              description: "Crosslinked PU network simulation combined with DSC, rheology, Tg measurements, and theory-guided Gaussian-process regression.",
              preview: "assets/images/polymer-network.svg",
              images: [
                { src: "assets/images/polymer-network.svg", caption: "Crosslinked PU molecular network" },
                { src: "assets/images/tg-curve.svg", caption: "Tg(α) prediction" },
                { src: "assets/images/dsc.svg", caption: "DSC cure characterization" }
              ],
              models: ["Topological crosslinking", "LAMMPS NPT thermal scans", "Tg(α)", "DiBenedetto-guided GPR"],
              papers: [
                { title: "A Theory-Guided Machine Learning and Molecular Dynamics Approach for Characterizing Fast-Curing Polyurethane Systems", meta: "Polymers, 2026", url: "https://doi.org/10.3390/polym18060679" }
              ],
              next: ["Predict additional cure-dependent properties", "Propagate molecular uncertainty into manufacturing models"]
            },
            {
              id: "pp-carbon",
              name: "PP / Carbon Fiber Interface",
              category: "composites",
              description: "Atomistic investigation of PP–carbon interfacial structure, interaction energy, and adhesion.",
              preview: "assets/images/pp-carbon-interface.svg",
              images: [
                { src: "assets/images/pp-carbon-interface.svg", caption: "PP / carbon-fiber interface model" }
              ],
              models: ["PP molecular slab", "Graphitic carbon surface", "Interaction energy", "Work of adhesion"],
              papers: [],
              next: ["Run separation simulations", "Compare different carbon-surface chemistries"]
            },
            {
              id: "pp-cellulose",
              name: "PP / Cellulose Interface",
              category: "composites",
              description: "CHARMM-based PP / cellulose interface model for interfacial bonding and adhesion studies.",
              preview: "assets/images/pp-cellulose.svg",
              images: [
                { src: "assets/images/pp-cellulose.svg", caption: "PP / cellulose molecular interface" }
              ],
              models: ["Cellulose slab", "PP packing", "CHARMM bonded interactions", "Urey–Bradley terms"],
              papers: [],
              next: ["Validate force-field mapping", "Calculate separation energy and work of adhesion"]
            }
          ]
        },
        {
          id: "composite-validation",
          name: "Composite Experimental Validation",
          category: "composites",
          description: "Experimental characterization used to calibrate and validate pultrusion, cure, molecular, and mechanical models.",
          preview: "assets/images/lab-validation.svg",
          images: [
            { src: "assets/images/dsc.svg", caption: "DSC / cure characterization" },
            { src: "assets/images/lab-validation.svg", caption: "Rheology / DMA / laboratory validation" },
            { src: "assets/images/load-cell.svg", caption: "Pultrusion load-cell validation" }
          ],
          models: ["DSC", "Rheology / DMA", "Mechanical testing", "Load-cell force measurement"],
          papers: [],
          next: ["Synchronize model outputs with directly measurable quantities", "Build a reusable pultrusion validation dataset"]
        },
        {
          id: "composite-output",
          name: "Composite Publications & Industry Translation",
          category: "composites",
          description: "Publication output and translation of composite-manufacturing models to industrial process design.",
          preview: "assets/images/publications.svg",
          images: [
            { src: "assets/images/publications.svg", caption: "Composite research publications" },
            { src: "assets/images/pultrusion.svg", caption: "Industrial pultrusion translation" }
          ],
          models: ["Polymers 2026", "Solid State Phenomena 2026", "SAMPE 2026", "BASF / Pulflex collaboration"],
          papers: [
            { title: "A Theory-Guided Machine Learning and Molecular Dynamics Approach for Characterizing Fast-Curing Polyurethane Systems", meta: "Polymers, 2026", url: "https://doi.org/10.3390/polym18060679" },
            { title: "Thermo-Chemical Modeling and Experimental Validation of Pultruded Glass Fiber Reinforced Composites", meta: "Solid State Phenomena, 2026", url: "https://doi.org/10.4028/p-Wf7rKC" },
            { title: "Beyond Homogeneity: Fiber Architecture Effects on the Structural Performance of Pultruded Thermoset Composites", meta: "SAMPE 2026", url: "https://doi.org/10.33599/nasampe/s.26.32" }
          ],
          next: ["Connect publications to dissertation chapters", "Use industrial validation to strengthen process-design recommendations"]
        }
      ]
    },
    {
      id: "battery-theme",
      name: "Theme II — Battery Manufacturing & Multiscale Modeling",
      category: "battery",
      description: "Battery-manufacturing research linking cathode mechanics, dry processing, electrostatic spray, solid electrolyte modeling, electrochemical transport, and experimental validation.",
      preview: "assets/images/calendering.svg",
      images: [
        { src: "assets/images/cathode-microstructure.svg", caption: "Cathode microstructure / heterogeneous RVE" },
        { src: "assets/images/calendering.svg", caption: "Electrode calendering" },
        { src: "assets/images/electrostatic-spray.svg", caption: "Electrostatic dry-powder deposition" },
        { src: "assets/images/lpscl.svg", caption: "Li6PS5Cl solid-electrolyte model" }
      ],
      models: [
        "Cathode mechanics and calendering",
        "Dry electrode / solid-state manufacturing",
        "Electrostatic spray and deflector design",
        "Electrochemical performance linkage",
        "Solid-electrolyte molecular modeling",
        "Experimental validation"
      ],
      papers: [
        { title: "Dry Electrode Processing for Lithium-Ion Battery Cathodes and Anodes: Materials, Fabrication Strategies, and Future Outlook", meta: "Related paper, 2025", url: "https://doi.org/10.1002/admt.202501420" },
        { title: "A Computational Workflow for the Simulation of Solid State Battery Electrodes from Manufacturing to Electrochemical Performance", meta: "Related paper, 2025", url: "https://doi.org/10.1016/j.jpowsour.2024.236131" }
      ],
      next: [
        "Connect manufacturing-induced microstructure to electrochemical behavior",
        "Improve dry-electrode uniformity and mechanical integrity",
        "Integrate continuum and molecular-scale battery models"
      ],
      children: [
        {
          id: "battery-mechanics",
          name: "Cathode Mechanics & Calendering",
          category: "battery",
          description: "Microstructure-informed cathode compression, unloading, residual porosity, reduced-order modeling, and roller calendering.",
          preview: "assets/images/cathode-microstructure.svg",
          images: [
            { src: "assets/images/cathode-microstructure.svg", caption: "SEM-derived heterogeneous RVE" },
            { src: "assets/images/stress-field.svg", caption: "Stress / porosity field" },
            { src: "assets/images/calendering.svg", caption: "3D roller calendering" }
          ],
          models: ["SEM → RVE", "2D Abaqus compression", "1D reduced-order model", "3D roller calendering", "Porosity evolution / unloading"],
          papers: [],
          next: ["Compare 90:5:5 and 96:2:2 microstructures", "Link residual porosity to transport and performance"],
          children: [
            {
              id: "sem-rve",
              name: "SEM → Heterogeneous RVE",
              category: "battery",
              description: "Image-derived NMC / CBD / pore morphology converted into heterogeneous mechanical models.",
              preview: "assets/images/cathode-microstructure.svg",
              images: [
                { src: "assets/images/cathode-microstructure.svg", caption: "Cathode microstructure" },
                { src: "assets/images/mesh-model.svg", caption: "Image-to-model discretization" }
              ],
              models: ["SEM segmentation", "Phase mapping", "Section-property mapping", "Porosity initialization"],
              papers: [],
              next: ["Automate image-to-RVE workflow", "Quantify microstructure-to-response variability"]
            },
            {
              id: "battery-2d1d",
              name: "2D Abaqus + 1D Reduced-Order Model",
              category: "battery",
              description: "Heterogeneous 2D mechanics and fast row-averaged reduced-order prediction of electrode compression and unloading.",
              preview: "assets/images/stress-field.svg",
              images: [
                { src: "assets/images/stress-field.svg", caption: "Mechanical field during compaction" },
                { src: "assets/images/cathode-microstructure.svg", caption: "Heterogeneous structure input" }
              ],
              models: ["2D heterogeneous model", "Full-cycle loading / unloading", "1D ROM", "Porosity reconstruction"],
              papers: [],
              next: ["Complete composition / structure batch", "Use ROM for rapid process studies"]
            },
            {
              id: "roller-calender",
              name: "3D Roller Calendering",
              category: "battery",
              description: "Roller–electrode contact, foil support, friction, and gap-controlled densification of cathodes.",
              preview: "assets/images/calendering.svg",
              images: [
                { src: "assets/images/calendering.svg", caption: "3D roller-calendering setup" }
              ],
              models: ["Roller contact", "Electrode + Al foil", "Gap study", "Friction and residual deformation"],
              papers: [],
              next: ["Compare roller-model output with reduced compression models", "Extract post-calender porosity fields"]
            }
          ]
        },
        {
          id: "dry-manufacturing",
          name: "Dry Electrode & Solid-State Manufacturing",
          category: "battery",
          description: "Solvent-free powder processing of NMC811, Li6PS5Cl, conductive additives, and binders through mixing, spraying, and hot calendering.",
          preview: "assets/images/dry-powder.svg",
          images: [
            { src: "assets/images/dry-powder.svg", caption: "Dry catholyte powder mixture" },
            { src: "assets/images/electrostatic-spray.svg", caption: "Electrostatic powder deposition" },
            { src: "assets/images/calendering.svg", caption: "Hot calendering / densification" }
          ],
          models: ["Dry mixing", "CNF / binder dispersion", "Electrostatic spray", "Hot calendering", "Adhesion / delamination"],
          papers: [
            { title: "Dry Electrode Processing for Lithium-Ion Battery Cathodes and Anodes: Materials, Fabrication Strategies, and Future Outlook", meta: "Related paper, 2025", url: "https://doi.org/10.1002/admt.202501420" }
          ],
          next: ["Reduce CNF agglomeration", "Improve catholyte uniformity", "Increase mechanical integrity after calendering"],
          children: [
            {
              id: "mixing-binder",
              name: "Dry Mixing, CNF & Binder",
              category: "battery",
              description: "Powder mixing and conductive/binder-network development prior to deposition and calendering.",
              preview: "assets/images/dry-powder.svg",
              images: [
                { src: "assets/images/dry-powder.svg", caption: "Dry powder / CNF mixing" }
              ],
              models: ["NMC + SE mixing", "CNF dispersion", "Binder activation", "Powder morphology"],
              papers: [],
              next: ["Reduce fiber entanglement", "Optimize mixing sequence and intensity"]
            },
            {
              id: "spray-deflector",
              name: "Electrostatic Spray & Deflector",
              category: "battery",
              description: "Electrostatic particle deposition controlled by gun trajectory, electric field, and deflector geometry.",
              preview: "assets/images/electrostatic-spray.svg",
              images: [
                { src: "assets/images/electrostatic-spray.svg", caption: "Electrostatic spray deposition" },
                { src: "assets/images/electric-field.svg", caption: "Electric-field / particle-trajectory visualization" }
              ],
              models: ["Electrostatic deposition", "Deflector geometry", "45° rotating spray path", "Deposition uniformity"],
              papers: [],
              next: ["Reduce center accumulation", "Compare alternative deflector shapes", "Validate deposition profiles experimentally"]
            },
            {
              id: "hot-calender",
              name: "Hot Calendering & Layer Integrity",
              category: "battery",
              description: "Thermal activation, densification, adhesion, roller pickup, and delamination during post-spray consolidation.",
              preview: "assets/images/calendering.svg",
              images: [
                { src: "assets/images/calendering.svg", caption: "Hot calendering concept" }
              ],
              models: ["Temperature-dependent binder activation", "Layer densification", "Adhesion / delamination", "Roller interaction"],
              papers: [],
              next: ["Identify temperature / pressure window", "Compare binder systems and substrate conditions"]
            }
          ]
        },
        {
          id: "battery-performance",
          name: "Electrochemical Performance Link",
          category: "battery",
          description: "Use manufactured porosity and phase distribution as inputs to transport and electrochemical performance models.",
          preview: "assets/images/transport.svg",
          images: [
            { src: "assets/images/transport.svg", caption: "Ionic / electronic transport field" },
            { src: "assets/images/cathode-microstructure.svg", caption: "Manufactured microstructure input" }
          ],
          models: ["Porosity → effective transport", "Ionic / electronic conduction", "Current-density heterogeneity", "EIS validation"],
          papers: [
            { title: "A Computational Workflow for the Simulation of Solid State Battery Electrodes from Manufacturing to Electrochemical Performance", meta: "Journal of Power Sources, 2025", url: "https://doi.org/10.1016/j.jpowsour.2024.236131" }
          ],
          next: ["Map Abaqus residual porosity into electrochemical coefficients", "Compare manufactured structures using EIS / transport metrics"]
        },
        {
          id: "solid-electrolyte-md",
          name: "Solid Electrolyte Molecular Modeling",
          category: "battery",
          description: "Li6PS5Cl argyrodite molecular simulation from supercell construction to future lithium-ion diffusion and conductivity prediction.",
          preview: "assets/images/lpscl.svg",
          images: [
            { src: "assets/images/lpscl.svg", caption: "Li6PS5Cl argyrodite structure" }
          ],
          models: ["2×2×2 supercell", "4×4×4 supercell", "NVT / NPT equilibration", "MSD / ionic conductivity"],
          papers: [],
          next: ["Validate interatomic potential", "Calculate Li-ion diffusivity and conductivity"]
        },
        {
          id: "battery-validation",
          name: "Battery Experimental Validation",
          category: "battery",
          description: "Mechanical, microstructural, process, and electrochemical measurements used to evaluate battery-manufacturing models.",
          preview: "assets/images/lab-validation.svg",
          images: [
            { src: "assets/images/cathode-microstructure.svg", caption: "SEM microstructure characterization" },
            { src: "assets/images/stress-field.svg", caption: "Compression / mechanics validation" },
            { src: "assets/images/lab-validation.svg", caption: "Laboratory process validation" },
            { src: "assets/images/transport.svg", caption: "EIS / transport validation concept" }
          ],
          models: ["SEM / EDS", "Compression testing", "Thickness / uniformity", "EIS pellet / electrode testing"],
          papers: [],
          next: ["Create matched process–microstructure–performance datasets", "Use experiments to rank dry-manufacturing conditions"]
        },
        {
          id: "battery-output",
          name: "Battery Publications & Future Work",
          category: "battery",
          description: "Planned manuscript structure and future integration of mechanics, dry manufacturing, molecular modeling, and electrochemical performance.",
          preview: "assets/images/publications.svg",
          images: [
            { src: "assets/images/publications.svg", caption: "Battery research manuscript pathway" }
          ],
          models: ["Cathode compaction manuscript", "Dry-manufacturing study", "Manufacturing-to-electrochemistry workflow", "Solid-electrolyte MD extension"],
          papers: [
            { title: "Dry Electrode Processing for Lithium-Ion Battery Cathodes and Anodes: Materials, Fabrication Strategies, and Future Outlook", meta: "Related paper, 2025", url: "https://doi.org/10.1002/admt.202501420" },
            { title: "A Computational Workflow for the Simulation of Solid State Battery Electrodes from Manufacturing to Electrochemical Performance", meta: "Related paper, 2025", url: "https://doi.org/10.1016/j.jpowsour.2024.236131" }
          ],
          next: ["Finalize cathode compaction paper structure", "Connect dry-process experiments to model-driven design decisions"]
        }
      ]
    }
  ]
};
