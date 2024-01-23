const { AbilityBuilder, Ability } = require('@casl/ability');

exports.defineAbilitiesFor=(user)=> {
  const { can, cannot, build } = new AbilityBuilder(Ability);
  // Define abilities based on user roles and permissions
  user.roles.forEach(role => {
    const [resource, action] = role.name.split('-'); // e.g., 'collection-write'
    can(action, resource);
  });
  return build();
}
