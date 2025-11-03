# ehr-module-simulator

The EHR Module Simulator is designed to help nursing students at OHSU practice real-world clinical decision-making and documentation in a simulated Electronic Health Record (EHR) environment.

This project provides specialty learning modules that mirror realistic patient care scenarios used in clinical learning labs. Students can interact with simulated patient charts, review provider orders, interpret clinical data, and perform virtual actions such as titrating medications or documenting care, just as they would in a real EHR system.

## Contact  
Carson Gabler:  
- ✉️ **Email:** [gablerc@oregonstate.edu](mailto:gablerc@oregonstate.edu)  
- 💼 **LinkedIn:** [linkedin.com/in/carsongabler](https://www.linkedin.com/in/carsongabler)  
- 🌐 **GitHub:** [github.com/cbgabler](https://github.com/cbgabler)
- **Role:** Project Manager

AJ Paumier:  
- ✉️ **Email:** [paumiera@oregonstate.edu](mailto:paumiera@oregonstate.edu)
- **Role:** Backend Software Developer

Thien Tu:  
- ✉️ **Email:** [tuthi@oregonstate.edu](mailto:tuthi@oregonstate.edu)
- **Role:** Backend Software Developer

Trey Springer:  
- ✉️ **Email:** [springet@oregonstate.edu](mailto:springet@oregonstate.edu)
- 💼 **LinkedIn:** [linkedin.com/in/treysp](https://www.linkedin.com/in/treysp/)
- 🌐 **GitHub:** [github.com/treyspringer](https://github.com/treyspringer)
- **Role:** Frontend Software Developer

Kristy Chen:  
- ✉️ **Email:** [chenkr@oregonstate.edu](mailto:chenkr@oregonstate.edu)
- **Role:** Frontend Software Developer

## How to Run
```
cd src
npm run dev
cd ../electron
npm start
```

## Branching Strategy

This project follows a structured branching strategy to ensure efficient collaboration and workflow:

### Branch Types
1. **`main`**: Long-running branch for production-ready code.  
2. **`feat/[topic-name]`**: Feature-specific branches created from `main`. Use for implementing features or fixes.  
3. **`feat/[topic-name]-topic/[subtopic-name]`**: Sub-branches for collaboration on feature parts. Created from `feat/[topic-name]`.  

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format for clarity:
- `fix:` Minor fixes or tweaks.
- `feat:` New features or enhancements.
- `chore:` Routine updates (e.g., dependency upgrades).
- `config:` Configuration changes.
- `merge:` Merge activity.
