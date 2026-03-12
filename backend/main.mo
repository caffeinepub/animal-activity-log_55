import OrderedMap "mo:base/OrderedMap";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor BallPythonTracker {

  public type AnimalId = Text;
  public type MealId = Nat;
  public type WeightId = Nat;
  public type PairingId = Nat;
  public type ClutchId = Nat;
  public type ShedId = Nat;
  public type TubChangeId = Nat;
  public type IdNumber = Text;

  public type Animal = {
    id : AnimalId;
    name : Text;
    genes : Text;
    sex : Text;
    birthday : ?Time.Time;
    weight : ?Nat;
    picture : ?Storage.ExternalBlob;
    idNumber : IdNumber;
  };

  public type Meal = {
    id : MealId;
    animalId : AnimalId;
    timestamp : Time.Time;
    details : Text;
  };

  public type WeightEntry = {
    id : WeightId;
    animalId : AnimalId;
    timestamp : Time.Time;
    weight : Nat;
  };

  public type PairingEntry = {
    id : PairingId;
    animalId : AnimalId;
    timestamp : Time.Time;
    notes : Text;
  };

  public type ClutchRecord = {
    id : ClutchId;
    clutchNumber : Nat;
    damId : AnimalId;
    sireId : AnimalId;
    dateEggsLaid : Time.Time;
    hatchDate : ?Time.Time;
    numEggsLaid : Nat;
    numHatched : Nat;
    numSlugs : Nat;
    outcomeNotes : Text;
  };

  public type ShedEntry = {
    id : ShedId;
    animalId : AnimalId;
    timestamp : Time.Time;
  };

  public type TubChangeEntry = {
    id : TubChangeId;
    animalId : AnimalId;
    timestamp : Time.Time;
  };

  public type BulkSnakeEntry = {
    name : Text;
    genes : Text;
    sex : Text;
    birthday : ?Time.Time;
    weight : ?Nat;
    picture : ?Storage.ExternalBlob;
    idNumber : IdNumber;
  };

  public type AnimalWithDaysSinceLastMeal = {
    animal : Animal;
    daysSinceLastMeal : ?Int;
  };

  public type AnimalWithDaysSinceLastMealAndPairing = {
    animal : Animal;
    daysSinceLastMeal : ?Int;
    daysSinceLastPairing : ?Int;
  };

  public type AnimalWithDaysSinceLastEvents = {
    animal : Animal;
    daysSinceLastMeal : ?Int;
    daysSinceLastPairing : ?Int;
    daysSinceLastShed : ?Int;
    daysSinceLastTubChange : ?Int;
    daysSinceLastClutch : ?Int;
  };

  public type UserProfile = {
    name : Text;
  };

  public type AnimalWeightUpdate = {
    animalId : AnimalId;
    weight : Nat;
  };

  public type ClutchInput = {
    clutchNumber : Nat;
    damId : AnimalId;
    sireId : AnimalId;
    dateEggsLaid : Time.Time;
    hatchDate : ?Time.Time;
    numEggsLaid : Nat;
    numHatched : Nat;
    numSlugs : Nat;
    outcomeNotes : Text;
  };

  public type CustomHeading = {
    heading : Text;
  };

  public type WaterChange = {
    lastChange : Time.Time;
  };

  public type ClutchEntry = {
    id : Nat;
    animalId : AnimalId;
    timestamp : Time.Time;
    notes : Text;
  };

  let accessControlState = AccessControl.initState();

  transient let animalMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let mealMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let weightMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let pairingMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let clutchMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let shedMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let tubChangeMap = OrderedMap.Make<Principal>(Principal.compare);
  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var userAnimals : OrderedMap.Map<Principal, OrderedMap.Map<AnimalId, Animal>> = animalMap.empty();
  var userMeals : OrderedMap.Map<Principal, OrderedMap.Map<MealId, Meal>> = mealMap.empty();
  var userWeights : OrderedMap.Map<Principal, OrderedMap.Map<WeightId, WeightEntry>> = weightMap.empty();
  var userPairings : OrderedMap.Map<Principal, OrderedMap.Map<PairingId, PairingEntry>> = pairingMap.empty();
  var userClutches : OrderedMap.Map<Principal, OrderedMap.Map<ClutchId, ClutchRecord>> = clutchMap.empty();
  var userSheds : OrderedMap.Map<Principal, OrderedMap.Map<ShedId, ShedEntry>> = shedMap.empty();
  var userTubChanges : OrderedMap.Map<Principal, OrderedMap.Map<TubChangeId, TubChangeEntry>> = tubChangeMap.empty();
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty();
  var userCustomHeadings : OrderedMap.Map<Principal, CustomHeading> = principalMap.empty();
  var userWaterChanges : OrderedMap.Map<Principal, WaterChange> = principalMap.empty();
  var userLogos : OrderedMap.Map<Principal, Storage.ExternalBlob> = principalMap.empty();
  var userAnimalClutches : OrderedMap.Map<Principal, OrderedMap.Map<Nat, ClutchEntry>> = clutchMap.empty();
  var registeredUsers : OrderedMap.Map<Principal, Bool> = principalMap.empty();
  var nextMealId : MealId = 0;
  var nextWeightId : WeightId = 0;
  var nextPairingId : PairingId = 0;
  var nextClutchId : ClutchId = 0;
  var nextShedId : ShedId = 0;
  var nextTubChangeId : TubChangeId = 0;
  let storage = Storage.new();

  include MixinStorage(storage);

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
    registeredUsers := principalMap.put(registeredUsers, caller, true);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    switch (principalMap.get(registeredUsers, caller)) {
      case null { #guest };
      case (?_) {
        AccessControl.getUserRole(accessControlState, caller);
      };
    };
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
    registeredUsers := principalMap.put(registeredUsers, user, true);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func setCustomHeading(heading : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can set custom heading");
    };

    let customHeading : CustomHeading = {
      heading;
    };

    userCustomHeadings := principalMap.put(userCustomHeadings, caller, customHeading);
  };

  public query ({ caller }) func getCustomHeading() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can get custom heading");
    };
    switch (principalMap.get(userCustomHeadings, caller)) {
      case (?customHeading) { customHeading.heading };
      case null { "Animal Activity Log" };
    };
  };

  public shared ({ caller }) func updateWaterChange() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update water change");
    };

    let waterChange : WaterChange = {
      lastChange = Time.now();
    };

    userWaterChanges := principalMap.put(userWaterChanges, caller, waterChange);
  };

  public query ({ caller }) func getLastWaterChange() : async ?Time.Time {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can get water change");
    };
    switch (principalMap.get(userWaterChanges, caller)) {
      case (?waterChange) { ?waterChange.lastChange };
      case null { null };
    };
  };

  func getUserAnimals(caller : Principal) : OrderedMap.Map<AnimalId, Animal> {
    switch (animalMap.get(userAnimals, caller)) {
      case (?animals) { animals };
      case null {
        let newAnimals = textMap.empty<Animal>();
        userAnimals := animalMap.put(userAnimals, caller, newAnimals);
        newAnimals;
      };
    };
  };

  func getUserMeals(caller : Principal) : OrderedMap.Map<MealId, Meal> {
    switch (mealMap.get(userMeals, caller)) {
      case (?meals) { meals };
      case null {
        let newMeals = natMap.empty<Meal>();
        userMeals := mealMap.put(userMeals, caller, newMeals);
        newMeals;
      };
    };
  };

  func getUserWeights(caller : Principal) : OrderedMap.Map<WeightId, WeightEntry> {
    switch (weightMap.get(userWeights, caller)) {
      case (?weights) { weights };
      case null {
        let newWeights = natMap.empty<WeightEntry>();
        userWeights := weightMap.put(userWeights, caller, newWeights);
        newWeights;
      };
    };
  };

  func getUserPairings(caller : Principal) : OrderedMap.Map<PairingId, PairingEntry> {
    switch (pairingMap.get(userPairings, caller)) {
      case (?pairings) { pairings };
      case null {
        let newPairings = natMap.empty<PairingEntry>();
        userPairings := pairingMap.put(userPairings, caller, newPairings);
        newPairings;
      };
    };
  };

  func getUserClutches(caller : Principal) : OrderedMap.Map<ClutchId, ClutchRecord> {
    switch (clutchMap.get(userClutches, caller)) {
      case (?clutches) { clutches };
      case null {
        let newClutches = natMap.empty<ClutchRecord>();
        userClutches := clutchMap.put(userClutches, caller, newClutches);
        newClutches;
      };
    };
  };

  func getUserSheds(caller : Principal) : OrderedMap.Map<ShedId, ShedEntry> {
    switch (shedMap.get(userSheds, caller)) {
      case (?sheds) { sheds };
      case null {
        let newSheds = natMap.empty<ShedEntry>();
        userSheds := shedMap.put(userSheds, caller, newSheds);
        newSheds;
      };
    };
  };

  func getUserTubChanges(caller : Principal) : OrderedMap.Map<TubChangeId, TubChangeEntry> {
    switch (tubChangeMap.get(userTubChanges, caller)) {
      case (?tubChanges) { tubChanges };
      case null {
        let newTubChanges = natMap.empty<TubChangeEntry>();
        userTubChanges := tubChangeMap.put(userTubChanges, caller, newTubChanges);
        newTubChanges;
      };
    };
  };

  func getUserAnimalClutches(caller : Principal) : OrderedMap.Map<Nat, ClutchEntry> {
    switch (clutchMap.get(userAnimalClutches, caller)) {
      case (?animalClutches) { animalClutches };
      case null {
        let newAnimalClutches = natMap.empty<ClutchEntry>();
        userAnimalClutches := clutchMap.put(userAnimalClutches, caller, newAnimalClutches);
        newAnimalClutches;
      };
    };
  };

  public shared ({ caller }) func addAnimal(name : Text, genes : Text, sex : Text, birthday : ?Time.Time, weight : ?Nat, picture : ?Storage.ExternalBlob, idNumber : IdNumber) : async AnimalId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add animals");
    };

    let id = name # "-" # genes;
    let animal : Animal = {
      id;
      name;
      genes;
      sex;
      birthday;
      weight;
      picture;
      idNumber;
    };

    let animals = getUserAnimals(caller);
    let updatedAnimals = textMap.put(animals, id, animal);
    userAnimals := animalMap.put(userAnimals, caller, updatedAnimals);
    id;
  };

  public shared ({ caller }) func addBulkSnakes(snakes : [BulkSnakeEntry]) : async [AnimalId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add animals");
    };

    let animals = getUserAnimals(caller);
    var updatedAnimals = animals;

    let ids = Array.map<BulkSnakeEntry, AnimalId>(
      snakes,
      func(snake) {
        let id = snake.name # "-" # snake.genes;
        let animal : Animal = {
          id;
          name = snake.name;
          genes = snake.genes;
          sex = snake.sex;
          birthday = snake.birthday;
          weight = snake.weight;
          picture = snake.picture;
          idNumber = snake.idNumber;
        };
        updatedAnimals := textMap.put(updatedAnimals, id, animal);
        id;
      },
    );

    userAnimals := animalMap.put(userAnimals, caller, updatedAnimals);
    ids;
  };

  public query ({ caller }) func getAnimals() : async [Animal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view animals");
    };
    let animals = getUserAnimals(caller);
    Iter.toArray(textMap.vals(animals));
  };

  public shared ({ caller }) func addMeal(animalId : AnimalId, details : Text, timestamp : Time.Time) : async MealId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add meals");
    };

    let meal : Meal = {
      id = nextMealId;
      animalId;
      timestamp;
      details;
    };

    let meals = getUserMeals(caller);
    let updatedMeals = natMap.put(meals, nextMealId, meal);
    userMeals := mealMap.put(userMeals, caller, updatedMeals);
    nextMealId += 1;
    meal.id;
  };

  public shared ({ caller }) func addBulkMealsForSelectedAnimals(animalIds : [AnimalId], details : Text, timestamp : Time.Time) : async [MealId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add bulk meals");
    };

    let meals = getUserMeals(caller);
    var updatedMeals = meals;

    let mealIds = Array.map<AnimalId, MealId>(
      animalIds,
      func(animalId) {
        let meal : Meal = {
          id = nextMealId;
          animalId;
          timestamp;
          details;
        };
        updatedMeals := natMap.put(updatedMeals, nextMealId, meal);
        let currentId = nextMealId;
        nextMealId += 1;
        currentId;
      },
    );

    userMeals := mealMap.put(userMeals, caller, updatedMeals);
    mealIds;
  };

  public query ({ caller }) func getMealsForAnimal(animalId : AnimalId) : async [Meal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view meals");
    };
    let meals = getUserMeals(caller);
    let allMeals = Iter.toArray(natMap.vals(meals));
    Array.filter<Meal>(allMeals, func(meal) { meal.animalId == animalId });
  };

  public query ({ caller }) func getAnimalsWithDaysSinceLastMeal() : async [AnimalWithDaysSinceLastMeal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view animal data");
    };
    let animals = getUserAnimals(caller);
    let meals = getUserMeals(caller);
    let currentTime = Time.now();

    let animalArray = Iter.toArray(textMap.vals(animals));
    Array.map<Animal, AnimalWithDaysSinceLastMeal>(
      animalArray,
      func(animal) {
        let animalMeals = Array.filter<Meal>(
          Iter.toArray(natMap.vals(meals)),
          func(meal) { meal.animalId == animal.id },
        );

        let lastMeal = Array.foldLeft<Meal, ?Meal>(
          animalMeals,
          null,
          func(acc, meal) {
            switch (acc) {
              case null { ?meal };
              case (?current) {
                if (meal.timestamp > current.timestamp) { ?meal } else {
                  ?current;
                };
              };
            };
          },
        );

        let daysSinceLastMeal = switch (lastMeal) {
          case null { null };
          case (?meal) {
            let timeDiff = currentTime - meal.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        {
          animal;
          daysSinceLastMeal;
        };
      },
    );
  };

  public query ({ caller }) func getAnimalsWithDaysSinceLastMealAndPairing() : async [AnimalWithDaysSinceLastMealAndPairing] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view animal data");
    };
    let animals = getUserAnimals(caller);
    let meals = getUserMeals(caller);
    let pairings = getUserPairings(caller);
    let currentTime = Time.now();

    let animalArray = Iter.toArray(textMap.vals(animals));
    Array.map<Animal, AnimalWithDaysSinceLastMealAndPairing>(
      animalArray,
      func(animal) {
        let animalMeals = Array.filter<Meal>(
          Iter.toArray(natMap.vals(meals)),
          func(meal) { meal.animalId == animal.id },
        );

        let lastMeal = Array.foldLeft<Meal, ?Meal>(
          animalMeals,
          null,
          func(acc, meal) {
            switch (acc) {
              case null { ?meal };
              case (?current) {
                if (meal.timestamp > current.timestamp) { ?meal } else {
                  ?current;
                };
              };
            };
          },
        );

        let daysSinceLastMeal = switch (lastMeal) {
          case null { null };
          case (?meal) {
            let timeDiff = currentTime - meal.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        let animalPairings = Array.filter<PairingEntry>(
          Iter.toArray(natMap.vals(pairings)),
          func(pairing) { pairing.animalId == animal.id },
        );

        let lastPairing = Array.foldLeft<PairingEntry, ?PairingEntry>(
          animalPairings,
          null,
          func(acc, pairing) {
            switch (acc) {
              case null { ?pairing };
              case (?current) {
                if (pairing.timestamp > current.timestamp) {
                  ?pairing;
                } else { ?current };
              };
            };
          },
        );

        let daysSinceLastPairing = switch (lastPairing) {
          case null { null };
          case (?pairing) {
            let timeDiff = currentTime - pairing.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        {
          animal;
          daysSinceLastMeal;
          daysSinceLastPairing;
        };
      },
    );
  };

  public query ({ caller }) func getAnimalsWithDaysSinceLastEvents() : async [AnimalWithDaysSinceLastEvents] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view animal data");
    };
    let animals = getUserAnimals(caller);
    let meals = getUserMeals(caller);
    let pairings = getUserPairings(caller);
    let sheds = getUserSheds(caller);
    let tubChanges = getUserTubChanges(caller);
    let animalClutches = getUserAnimalClutches(caller);
    let currentTime = Time.now();

    let animalArray = Iter.toArray(textMap.vals(animals));
    Array.map<Animal, AnimalWithDaysSinceLastEvents>(
      animalArray,
      func(animal) {
        let animalMeals = Array.filter<Meal>(
          Iter.toArray(natMap.vals(meals)),
          func(meal) { meal.animalId == animal.id },
        );

        let lastMeal = Array.foldLeft<Meal, ?Meal>(
          animalMeals,
          null,
          func(acc, meal) {
            switch (acc) {
              case null { ?meal };
              case (?current) {
                if (meal.timestamp > current.timestamp) { ?meal } else {
                  ?current;
                };
              };
            };
          },
        );

        let daysSinceLastMeal = switch (lastMeal) {
          case null { null };
          case (?meal) {
            let timeDiff = currentTime - meal.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        let animalPairings = Array.filter<PairingEntry>(
          Iter.toArray(natMap.vals(pairings)),
          func(pairing) { pairing.animalId == animal.id },
        );

        let lastPairing = Array.foldLeft<PairingEntry, ?PairingEntry>(
          animalPairings,
          null,
          func(acc, pairing) {
            switch (acc) {
              case null { ?pairing };
              case (?current) {
                if (pairing.timestamp > current.timestamp) {
                  ?pairing;
                } else { ?current };
              };
            };
          },
        );

        let daysSinceLastPairing = switch (lastPairing) {
          case null { null };
          case (?pairing) {
            let timeDiff = currentTime - pairing.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        let animalSheds = Array.filter<ShedEntry>(
          Iter.toArray(natMap.vals(sheds)),
          func(shed) { shed.animalId == animal.id },
        );

        let lastShed = Array.foldLeft<ShedEntry, ?ShedEntry>(
          animalSheds,
          null,
          func(acc, shed) {
            switch (acc) {
              case null { ?shed };
              case (?current) {
                if (shed.timestamp > current.timestamp) { ?shed } else {
                  ?current;
                };
              };
            };
          },
        );

        let daysSinceLastShed = switch (lastShed) {
          case null { null };
          case (?shed) {
            let timeDiff = currentTime - shed.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        let animalTubChanges = Array.filter<TubChangeEntry>(
          Iter.toArray(natMap.vals(tubChanges)),
          func(tubChange) { tubChange.animalId == animal.id },
        );

        let lastTubChange = Array.foldLeft<TubChangeEntry, ?TubChangeEntry>(
          animalTubChanges,
          null,
          func(acc, tubChange) {
            switch (acc) {
              case null { ?tubChange };
              case (?current) {
                if (tubChange.timestamp > current.timestamp) {
                  ?tubChange;
                } else { ?current };
              };
            };
          },
        );

        let daysSinceLastTubChange = switch (lastTubChange) {
          case null { null };
          case (?tubChange) {
            let timeDiff = currentTime - tubChange.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        let animalClutchEntries = Array.filter<ClutchEntry>(
          Iter.toArray(natMap.vals(animalClutches)),
          func(clutch) { clutch.animalId == animal.id },
        );

        let lastClutch = Array.foldLeft<ClutchEntry, ?ClutchEntry>(
          animalClutchEntries,
          null,
          func(acc, clutch) {
            switch (acc) {
              case null { ?clutch };
              case (?current) {
                if (clutch.timestamp > current.timestamp) { ?clutch } else {
                  ?current;
                };
              };
            };
          },
        );

        let daysSinceLastClutch = switch (lastClutch) {
          case null { null };
          case (?clutch) {
            let timeDiff = currentTime - clutch.timestamp;
            ?(timeDiff / (24 * 60 * 60 * 1000000000));
          };
        };

        {
          animal;
          daysSinceLastMeal;
          daysSinceLastPairing;
          daysSinceLastShed;
          daysSinceLastTubChange;
          daysSinceLastClutch;
        };
      },
    );
  };

  public shared ({ caller }) func editAnimal(id : AnimalId, name : Text, genes : Text, sex : Text, birthday : ?Time.Time, weight : ?Nat, picture : ?Storage.ExternalBlob, idNumber : IdNumber) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit animals");
    };

    let animals = getUserAnimals(caller);
    switch (textMap.get(animals, id)) {
      case null { Debug.trap("Animal not found") };
      case (?_) {
        let updatedAnimal : Animal = {
          id;
          name;
          genes;
          sex;
          birthday;
          weight;
          picture;
          idNumber;
        };
        let updatedAnimals = textMap.put(animals, id, updatedAnimal);
        userAnimals := animalMap.put(userAnimals, caller, updatedAnimals);
      };
    };
  };

  public shared ({ caller }) func deleteAnimal(id : AnimalId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete animals");
    };

    let animals = getUserAnimals(caller);
    let updatedAnimals = textMap.delete(animals, id);
    userAnimals := animalMap.put(userAnimals, caller, updatedAnimals);
  };

  public shared ({ caller }) func editMeal(id : MealId, details : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit meals");
    };

    let meals = getUserMeals(caller);
    switch (natMap.get(meals, id)) {
      case null { Debug.trap("Meal not found") };
      case (?meal) {
        let updatedMeal : Meal = {
          id;
          animalId = meal.animalId;
          timestamp = meal.timestamp;
          details;
        };
        let updatedMeals = natMap.put(meals, id, updatedMeal);
        userMeals := mealMap.put(userMeals, caller, updatedMeals);
      };
    };
  };

  public shared ({ caller }) func deleteMeal(id : MealId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete meals");
    };

    let meals = getUserMeals(caller);
    let updatedMeals = natMap.delete(meals, id);
    userMeals := mealMap.put(userMeals, caller, updatedMeals);
  };

  public shared ({ caller }) func addBulkWeightsForSelectedAnimals(weightUpdates : [AnimalWeightUpdate]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add bulk weights");
    };

    let animals = getUserAnimals(caller);
    var updatedAnimals = animals;

    for (update in weightUpdates.vals()) {
      switch (textMap.get(animals, update.animalId)) {
        case null {};
        case (?animal) {
          let updatedAnimal : Animal = {
            animal with weight = ?update.weight;
          };
          updatedAnimals := textMap.put(updatedAnimals, update.animalId, updatedAnimal);

          let weightEntry : WeightEntry = {
            id = nextWeightId;
            animalId = update.animalId;
            timestamp = Time.now();
            weight = update.weight;
          };

          let weights = getUserWeights(caller);
          let updatedWeights = natMap.put(weights, nextWeightId, weightEntry);
          userWeights := weightMap.put(userWeights, caller, updatedWeights);
          nextWeightId += 1;
        };
      };
    };

    userAnimals := animalMap.put(userAnimals, caller, updatedAnimals);
  };

  public shared ({ caller }) func addWeightEntry(animalId : AnimalId, weight : Nat, timestamp : Time.Time) : async WeightId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add weight entries");
    };

    let weightEntry : WeightEntry = {
      id = nextWeightId;
      animalId;
      timestamp;
      weight;
    };

    let weights = getUserWeights(caller);
    let updatedWeights = natMap.put(weights, nextWeightId, weightEntry);
    userWeights := weightMap.put(userWeights, caller, updatedWeights);
    nextWeightId += 1;
    weightEntry.id;
  };

  public query ({ caller }) func getWeightHistoryForAnimal(animalId : AnimalId) : async [WeightEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view weight history");
    };
    let weights = getUserWeights(caller);
    let allWeights = Iter.toArray(natMap.vals(weights));
    Array.filter<WeightEntry>(allWeights, func(entry) { entry.animalId == animalId });
  };

  public shared ({ caller }) func editWeightEntry(id : WeightId, weight : Nat, timestamp : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit weight entries");
    };

    let weights = getUserWeights(caller);
    switch (natMap.get(weights, id)) {
      case null { Debug.trap("Weight entry not found") };
      case (?entry) {
        let updatedEntry : WeightEntry = {
          id;
          animalId = entry.animalId;
          timestamp;
          weight;
        };
        let updatedWeights = natMap.put(weights, id, updatedEntry);
        userWeights := weightMap.put(userWeights, caller, updatedWeights);
      };
    };
  };

  public shared ({ caller }) func deleteWeightEntry(id : WeightId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete weight entries");
    };

    let weights = getUserWeights(caller);
    let updatedWeights = natMap.delete(weights, id);
    userWeights := weightMap.put(userWeights, caller, updatedWeights);
  };

  public shared ({ caller }) func addBulkWeightEntries(weightEntries : [WeightEntry]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add bulk weight entries");
    };

    let weights = getUserWeights(caller);
    var updatedWeights = weights;

    for (entry in weightEntries.vals()) {
      let newEntry : WeightEntry = {
        id = nextWeightId;
        animalId = entry.animalId;
        timestamp = entry.timestamp;
        weight = entry.weight;
      };
      updatedWeights := natMap.put(updatedWeights, nextWeightId, newEntry);
      nextWeightId += 1;
    };

    userWeights := weightMap.put(userWeights, caller, updatedWeights);
  };

  public shared ({ caller }) func addPairingEntry(animalId : AnimalId, timestamp : Time.Time, notes : Text) : async PairingId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add pairing entries");
    };

    let pairingEntry : PairingEntry = {
      id = nextPairingId;
      animalId;
      timestamp;
      notes;
    };

    let pairings = getUserPairings(caller);
    let updatedPairings = natMap.put(pairings, nextPairingId, pairingEntry);
    userPairings := pairingMap.put(userPairings, caller, updatedPairings);
    nextPairingId += 1;
    pairingEntry.id;
  };

  public query ({ caller }) func getPairingHistoryForAnimal(animalId : AnimalId) : async [PairingEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view pairing history");
    };
    let pairings = getUserPairings(caller);
    let allPairings = Iter.toArray(natMap.vals(pairings));
    Array.filter<PairingEntry>(allPairings, func(entry) { entry.animalId == animalId });
  };

  public shared ({ caller }) func editPairingEntry(id : PairingId, timestamp : Time.Time, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit pairing entries");
    };

    let pairings = getUserPairings(caller);
    switch (natMap.get(pairings, id)) {
      case null { Debug.trap("Pairing entry not found") };
      case (?entry) {
        let updatedEntry : PairingEntry = {
          id;
          animalId = entry.animalId;
          timestamp;
          notes;
        };
        let updatedPairings = natMap.put(pairings, id, updatedEntry);
        userPairings := pairingMap.put(userPairings, caller, updatedPairings);
      };
    };
  };

  public shared ({ caller }) func deletePairingEntry(id : PairingId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete pairing entries");
    };

    let pairings = getUserPairings(caller);
    let updatedPairings = natMap.delete(pairings, id);
    userPairings := pairingMap.put(userPairings, caller, updatedPairings);
  };

  public shared ({ caller }) func uploadUserLogo(logo : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can upload logos");
    };
    userLogos := principalMap.put(userLogos, caller, logo);
  };

  public query ({ caller }) func getUserLogo() : async ?Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can get logos");
    };
    principalMap.get(userLogos, caller);
  };

  public shared ({ caller }) func addClutchRecord(clutchInput : ClutchInput) : async ClutchId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add clutch records");
    };

    let clutchId = nextClutchId;
    let clutchRecord : ClutchRecord = {
      id = clutchId;
      clutchNumber = clutchInput.clutchNumber;
      damId = clutchInput.damId;
      sireId = clutchInput.sireId;
      dateEggsLaid = clutchInput.dateEggsLaid;
      hatchDate = clutchInput.hatchDate;
      numEggsLaid = clutchInput.numEggsLaid;
      numHatched = clutchInput.numHatched;
      numSlugs = clutchInput.numSlugs;
      outcomeNotes = clutchInput.outcomeNotes;
    };

    let clutches = getUserClutches(caller);
    let updatedClutches = natMap.put(clutches, clutchId, clutchRecord);
    userClutches := clutchMap.put(userClutches, caller, updatedClutches);
    nextClutchId += 1;
    clutchId;
  };

  public query ({ caller }) func getClutchRecords() : async [ClutchRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view clutch records");
    };
    let clutches = getUserClutches(caller);
    Iter.toArray(natMap.vals(clutches));
  };

  public shared ({ caller }) func editClutchRecord(id : ClutchId, clutchInput : ClutchInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit clutch records");
    };

    let clutches = getUserClutches(caller);
    switch (natMap.get(clutches, id)) {
      case null { Debug.trap("Clutch record not found") };
      case (?_) {
        let updatedClutch : ClutchRecord = {
          id;
          clutchNumber = clutchInput.clutchNumber;
          damId = clutchInput.damId;
          sireId = clutchInput.sireId;
          dateEggsLaid = clutchInput.dateEggsLaid;
          hatchDate = clutchInput.hatchDate;
          numEggsLaid = clutchInput.numEggsLaid;
          numHatched = clutchInput.numHatched;
          numSlugs = clutchInput.numSlugs;
          outcomeNotes = clutchInput.outcomeNotes;
        };
        let updatedClutches = natMap.put(clutches, id, updatedClutch);
        userClutches := clutchMap.put(userClutches, caller, updatedClutches);
      };
    };
  };

  public shared ({ caller }) func deleteClutchRecord(id : ClutchId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete clutch records");
    };

    let clutches = getUserClutches(caller);
    let updatedClutches = natMap.delete(clutches, id);
    userClutches := clutchMap.put(userClutches, caller, updatedClutches);
  };

  public shared ({ caller }) func logShedOnly(animalId : AnimalId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can log shed");
    };

    let timestamp = Time.now();

    let shedEntry : ShedEntry = {
      id = nextShedId;
      animalId;
      timestamp;
    };

    let sheds = getUserSheds(caller);
    let updatedSheds = natMap.put(sheds, nextShedId, shedEntry);
    userSheds := shedMap.put(userSheds, caller, updatedSheds);
    nextShedId += 1;
  };

  public shared ({ caller }) func logTubChangeOnly(animalId : AnimalId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can log tub change");
    };

    let timestamp = Time.now();

    let tubChangeEntry : TubChangeEntry = {
      id = nextTubChangeId;
      animalId;
      timestamp;
    };

    let tubChanges = getUserTubChanges(caller);
    let updatedTubChanges = natMap.put(tubChanges, nextTubChangeId, tubChangeEntry);
    userTubChanges := tubChangeMap.put(userTubChanges, caller, updatedTubChanges);
    nextTubChangeId += 1;
  };

  public shared ({ caller }) func logShedAndTubChange(animalId : AnimalId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can log shed and tub change");
    };

    let timestamp = Time.now();

    let shedEntry : ShedEntry = {
      id = nextShedId;
      animalId;
      timestamp;
    };

    let tubChangeEntry : TubChangeEntry = {
      id = nextTubChangeId;
      animalId;
      timestamp;
    };

    let sheds = getUserSheds(caller);
    let tubChanges = getUserTubChanges(caller);

    let updatedSheds = natMap.put(sheds, nextShedId, shedEntry);
    let updatedTubChanges = natMap.put(tubChanges, nextTubChangeId, tubChangeEntry);

    userSheds := shedMap.put(userSheds, caller, updatedSheds);
    userTubChanges := tubChangeMap.put(userTubChanges, caller, updatedTubChanges);

    nextShedId += 1;
    nextTubChangeId += 1;
  };

  public query ({ caller }) func getShedHistoryForAnimal(animalId : AnimalId) : async [ShedEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view shed history");
    };
    let sheds = getUserSheds(caller);
    let allSheds = Iter.toArray(natMap.vals(sheds));
    Array.filter<ShedEntry>(allSheds, func(entry) { entry.animalId == animalId });
  };

  public query ({ caller }) func getTubChangeHistoryForAnimal(animalId : AnimalId) : async [TubChangeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view tub change history");
    };
    let tubChanges = getUserTubChanges(caller);
    let allTubChanges = Iter.toArray(natMap.vals(tubChanges));
    Array.filter<TubChangeEntry>(allTubChanges, func(entry) { entry.animalId == animalId });
  };

  public query ({ caller }) func getAnimalById(id : AnimalId) : async ?Animal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view animals");
    };

    let animals = getUserAnimals(caller);
    textMap.get(animals, id);
  };

  public shared ({ caller }) func recordClutch(animalId : AnimalId, notes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can record clutch entries");
    };

    let clutchId = nextClutchId;
    let clutchEntry : ClutchEntry = {
      id = clutchId;
      animalId;
      timestamp = Time.now();
      notes;
    };

    let animalClutches = getUserAnimalClutches(caller);
    let updatedAnimalClutches = natMap.put(animalClutches, clutchId, clutchEntry);
    userAnimalClutches := clutchMap.put(userAnimalClutches, caller, updatedAnimalClutches);
    nextClutchId += 1;
    clutchId;
  };

  public query ({ caller }) func getClutchHistoryForAnimal(animalId : AnimalId) : async [ClutchEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view clutch history");
    };

    let animalClutches = getUserAnimalClutches(caller);
    let allClutches = Iter.toArray(natMap.vals(animalClutches));
    Array.filter<ClutchEntry>(allClutches, func(entry) { entry.animalId == animalId });
  };

  public shared ({ caller }) func editClutchEntry(id : Nat, animalId : AnimalId, timestamp : Time.Time, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit clutch entries");
    };

    let animalClutches = getUserAnimalClutches(caller);
    switch (natMap.get(animalClutches, id)) {
      case null { Debug.trap("Clutch entry not found") };
      case (?_) {
        let updatedClutch : ClutchEntry = {
          id;
          animalId;
          timestamp;
          notes;
        };
        let updatedAnimalClutches = natMap.put(animalClutches, id, updatedClutch);
        userAnimalClutches := clutchMap.put(userAnimalClutches, caller, updatedAnimalClutches);
      };
    };
  };

  public shared ({ caller }) func deleteClutchEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete clutch entries");
    };

    let animalClutches = getUserAnimalClutches(caller);
    let updatedAnimalClutches = natMap.delete(animalClutches, id);
    userAnimalClutches := clutchMap.put(userAnimalClutches, caller, updatedAnimalClutches);
  };

  public shared ({ caller }) func editShedEntry(id : ShedId, animalId : AnimalId, timestamp : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit shed entries");
    };

    let sheds = getUserSheds(caller);
    switch (natMap.get(sheds, id)) {
      case null { Debug.trap("Shed entry not found") };
      case (?_) {
        let updatedShed : ShedEntry = {
          id;
          animalId;
          timestamp;
        };
        let updatedSheds = natMap.put(sheds, id, updatedShed);
        userSheds := shedMap.put(userSheds, caller, updatedSheds);
      };
    };
  };

  public shared ({ caller }) func deleteShedEntry(id : ShedId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete shed entries");
    };

    let sheds = getUserSheds(caller);
    let updatedSheds = natMap.delete(sheds, id);
    userSheds := shedMap.put(userSheds, caller, updatedSheds);
  };

  public shared ({ caller }) func editTubChangeEntry(id : TubChangeId, animalId : AnimalId, timestamp : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can edit tub change entries");
    };

    let tubChanges = getUserTubChanges(caller);
    switch (natMap.get(tubChanges, id)) {
      case null { Debug.trap("Tub change entry not found") };
      case (?_) {
        let updatedTubChange : TubChangeEntry = {
          id;
          animalId;
          timestamp;
        };
        let updatedTubChanges = natMap.put(tubChanges, id, updatedTubChange);
        userTubChanges := tubChangeMap.put(userTubChanges, caller, updatedTubChanges);
      };
    };
  };

  public shared ({ caller }) func deleteTubChangeEntry(id : TubChangeId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete tub change entries");
    };

    let tubChanges = getUserTubChanges(caller);
    let updatedTubChanges = natMap.delete(tubChanges, id);
    userTubChanges := tubChangeMap.put(userTubChanges, caller, updatedTubChanges);
  };
};
